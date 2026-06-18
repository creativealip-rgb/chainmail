import type { MiddlewareHandler } from "hono";
import { verifyAccessToken } from "../lib/jwt.js";

export type ChainmailVars = {
  userId: string;
  email: string;
};

export const requireAuth = (): MiddlewareHandler<{ Variables: ChainmailVars }> => {
  return async (c, next) => {
    const authHeader = c.req.header("authorization") ?? "";
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      return c.json({ error: "missing_bearer_token" }, 401);
    }
    const token = match[1]!;
    try {
      const payload = await verifyAccessToken(token);
      c.set("userId", payload.sub);
      c.set("email", payload.email);
    } catch (e) {
      return c.json({ error: "invalid_token", message: e instanceof Error ? e.message : "verify failed" }, 401);
    }
    await next();
  };
};
