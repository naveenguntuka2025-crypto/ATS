import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

// Postgres via node-postgres. Required for production (and for local dev too)
// because the web app and the mass-email worker (workers/email-worker.ts) run
// as separate processes/containers — they need a real shared database server,
// not a local SQLite file. For local dev, run Postgres via
// `docker compose up -d` (see docker-compose.yml) or any local install, and
// set DATABASE_URL, e.g.:
//   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ats_app"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set — see .env.example");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, { schema });
export type DB = typeof db;
