/**
 * Env validation — fail fast if required vars missing.
 */
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32).default("dev-access-secret-change-in-prod-32chars-min"),
  JWT_REFRESH_SECRET: z.string().min(32).default("dev-refresh-secret-change-in-prod-32chars-min"),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("[env] invalid configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
