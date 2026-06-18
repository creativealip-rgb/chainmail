import type { Context } from "hono";
import type { ErrorHandler } from "hono";

export const errorHandler: ErrorHandler = (err: Error, c: Context) => {
  console.error(`[api error] ${err.name}: ${err.message}`, err.stack);
  if (err.name === "ZodError") {
    return c.json({ error: "validation_error", issues: (err as unknown as { issues: unknown }).issues }, 400);
  }
  return c.json({ error: "internal_server_error", message: err.message }, 500);
};
