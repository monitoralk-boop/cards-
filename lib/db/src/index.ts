import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

export const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

export const pool = hasDatabaseUrl
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

export const db: NodePgDatabase<typeof schema> = pool
  ? drizzle(pool, { schema })
  : (null as unknown as NodePgDatabase<typeof schema>);

export function getDatabase(): NodePgDatabase<typeof schema> {
  if (!db) {
    throw new Error(
      "DATABASE_URL is not set. Please provide your Supabase/PostgreSQL connection string.",
    );
  }
  return db;
}

export * from "./schema";
