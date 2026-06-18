/**
 * Run Drizzle migrations from compiled schema → SQL.
 * Usage: pnpm db:migrate
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { env } from "../lib/env.js";

async function main() {
  const sql = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(sql);
  console.log(`[migrate] running migrations on ${env.DATABASE_URL.replace(/:[^:@]*@/, ":***@")}`);
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("[migrate] done");
  await sql.end();
}

main().catch((e) => {
  console.error("[migrate] failed:", e);
  process.exit(1);
});
