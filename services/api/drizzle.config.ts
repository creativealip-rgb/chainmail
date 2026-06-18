import type { Config } from "drizzle-kit";

const url =
  process.env.DATABASE_URL ??
  "postgres://chainmail:***@chainmail-pg:5432/chainmail";

export default {
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
  strict: true,
  verbose: true,
} satisfies Config;
