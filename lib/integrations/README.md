# Job board adapters

Every adapter in this folder implements the `JobBoardAdapter` interface
(`types.ts`): `postRequirement`, `searchCandidates`, `importCandidate`.

## Why these run in "stub mode" today

Dice, LinkedIn, Monster, Indeed, CareerBuilder, and ZipRecruiter do **not**
offer open self-serve APIs. Getting real API access requires becoming an
approved technology/data partner with each board — a business step (contract,
review, sometimes a fee), not something an API key from a signup form gets
you. Until that partnership is in place for a given board, that board's
adapter:

- returns clearly-labeled simulated data (`stub: true` in the raw payload) so
  every downstream feature — search UI, import flow, matching into the
  Candidate table — can be built and demoed end-to-end today, and
- logs a note explaining what real credentials would unlock.

## Activating a real integration

Once you have partner credentials for a board:

1. Open `lib/integrations/<provider>.ts`.
2. Replace the stub branch's simulated response with a real `fetch()` call
   to that provider's documented API, using credentials loaded from the
   `job_board_integrations` table (see `registry.ts`).
3. Nothing else in the app needs to change — the Admin -> Integrations page,
   the adapter interface, and every page that imports candidates already
   expect this shape.

## Zoho WorkDrive is different

Document storage (resumes, offer letters) lives in `lib/storage/`, not here.
Zoho WorkDrive has a real, self-serve OAuth2 API — see
`lib/storage/zoho-workdrive.ts`, which is a working implementation, not a
stub. You only need to generate credentials in the Zoho API Console and enter
them under Admin -> Integrations.
