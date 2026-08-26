import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

function resolveDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (url === undefined || url.length === 0) {
    throw new Error("DATABASE_URL is required");
  }
  return url;
}

let pool: Pool | null = null;

function getPoolInternal(): Pool {
  if (pool === null) {
    pool = new Pool({ connectionString: resolveDatabaseUrl() });
  }
  return pool;
}

export function getPool(): Pool {
  return getPoolInternal();
}

export function getDb() {
  return drizzle(getPoolInternal(), { schema });
}

export async function closeDb(): Promise<void> {
  if (pool !== null) {
    await pool.end();
    pool = null;
  }
}
