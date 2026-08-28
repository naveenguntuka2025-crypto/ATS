# IT Staffing ATS

An internal ATS covering daily requirement intake (managers), resume submissions
(recruiters), shared team-wide visibility, document storage, mass email, and a
pluggable job-board integration layer. See `ats-spec.md` for the full product/
architecture spec.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Drizzle ORM + Postgres (required in both dev and production — the web app
  and the mass-email worker run as separate processes and need a real shared
  database, not a local file)
- Cookie/JWT session auth (bcrypt + jose), role-based access (Admin / Manager / Recruiter)
- BullMQ + Redis for the mass-email background queue
- Amazon SES (self-serve) for sending, Zoho WorkDrive (self-serve) for document storage
- Stubbed adapters for Dice / LinkedIn / Monster / Indeed / CareerBuilder / ZipRecruiter
  (these require a partner API agreement — see `lib/integrations/README.md`)

## Getting started

Postgres and Redis are both required — the easiest way to get both locally is
Docker Compose:

```bash
npm install
cp .env.example .env          # already points at the docker-compose services
docker compose up -d          # starts Postgres (5432) + Redis (6379)
npm run db:push               # create the schema
npm run seed                  # demo users, clients, requirements, candidates
npm run dev                   # http://localhost:3000
```

No Docker? Point `DATABASE_URL` in `.env` at any Postgres 14+ instance and
`REDIS_URL` at any Redis instance instead, then run the same `db:push` /
`seed` / `dev` steps.

Demo logins (seeded, password `password123` for all):

| Email | Role |
|---|---|
| admin@demo.com | Admin |
| manager@demo.com | Manager |
| recruiter1@demo.com | Recruiter |
| recruiter2@demo.com | Recruiter |

## Mass email needs Redis + a worker process

Sending to a list never happens inline in the request — see
`lib/queue/mail-queue.ts` for why. "Queue campaign" on the Mass Email page
writes the campaign + recipient rows and pushes one job per recipient onto a
Redis-backed BullMQ queue, then returns immediately. A **separate** process
drains that queue at a throttled rate (default 5/sec):

```bash
# have Redis running (redis-server, or `docker run -p 6379:6379 redis`)
npm run worker:email
```

Run this alongside `npm run dev` / `npm run start` in development, and as
its own deployed service/dyno in production (same `REDIS_URL` and
`DATABASE_URL` as the web app). Without it running, campaigns will sit in
`QUEUED` forever — that's expected, not a bug.

## Integrations (Admin -> Integrations)

- **Zoho WorkDrive** (documents/resumes) and **Amazon SES** (mass email) are
  both real, self-serve APIs — generate credentials in their respective
  consoles and enter them here. Until configured, documents fall back to
  local disk storage and mass email is disabled.
- **Dice, LinkedIn, Monster, Indeed, CareerBuilder, ZipRecruiter** all require
  becoming an approved technology/data partner with that company — there is
  no self-serve API key for any of them. Their adapters run in "stub mode"
  (clearly-labeled simulated data) so the rest of the app can be built and
  demoed against them today; see `lib/integrations/README.md` for how to
  wire in real calls once you have partner access.

## Deploying (Render)

`render.yaml` is a ready-to-use [Render Blueprint](https://render.com/docs/blueprint-spec)
that provisions all four pieces this app needs and wires them together:

- `ats-web` — the Next.js app (web service)
- `ats-email-worker` — the mass-email background worker (background worker
  service, `npm run worker:email` — see below; this is a **separate**
  service/container from `ats-web`, not a thread inside it)
- `ats-postgres` — managed Postgres
- `ats-redis` — managed Redis-compatible Key Value store, for the BullMQ queue

To deploy: push this project to a Git repo, then in the Render dashboard
choose **New -> Blueprint** and point it at the repo. Render reads
`render.yaml`, creates all four resources, and injects `DATABASE_URL` /
`REDIS_URL` / a generated `AUTH_SECRET` automatically — no manual env var
copying between services. The blueprint defaults every service to the free
tier so you can deploy at zero cost; see the comments at the top of
`render.yaml` for the two free-tier tradeoffs (Postgres auto-deletes after 30
days, the web service spins down when idle) and how to move off them.

After the first deploy, run `npm run seed` against the deployed
`DATABASE_URL` (e.g. via Render's shell) if you want the same demo data as
local dev — the blueprint itself only creates the schema (`db:push` runs as
part of the web service's build step), it doesn't seed data.

Deploying elsewhere (Railway, Fly.io, a VPS, etc.) works the same way in
spirit: one process running `npm start` for the web app, a **second**,
separate process running `npm run worker:email`, both pointed at the same
Postgres and Redis instances. `docker-compose.yml` in this repo is for local
Postgres/Redis only — it's not a deployment config for the app itself.

## Project structure

```
app/(app)/          authenticated pages (dashboard, requirements, candidates, submissions, clients, admin, mail)
app/login/           login page
db/                  Drizzle schema, client, seed script, migrations
lib/actions/         Server Actions (all mutations)
lib/auth.ts           session/auth helpers
lib/integrations/     job board adapters (stub mode) + registry
lib/storage/           document storage adapters (Zoho WorkDrive + local)
lib/email/             Amazon SES adapter
lib/queue/              BullMQ queue definition
workers/email-worker.ts  the mass-email background worker (separate process)
docker-compose.yml       local Postgres + Redis for dev
render.yaml               Render Blueprint (web + worker + Postgres + Redis)
```
