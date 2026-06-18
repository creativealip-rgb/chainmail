import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, sessions } from "../db/schema/index.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt.js";
import { requireAuth, type ChainmailVars } from "../middleware/auth.js";

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const auth = new Hono<{ Variables: ChainmailVars }>();

auth.post("/sign-up", zValidator("json", signUpSchema), async (c) => {
  const { email, password } = c.req.valid("json");
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existing.length > 0) {
    return c.json({ error: "email_taken", message: "Email already registered" }, 409);
  }

  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values({
      email: normalizedEmail,
      passwordHash,
    })
    .returning({ id: users.id, email: users.email, createdAt: users.createdAt });

  if (!user) {
    return c.json({ error: "insert_failed" }, 500);
  }

  const accessToken = await signAccessToken({ sub: user.id, email: user.email });
  const { token: refreshToken, jti } = await signRefreshToken({ sub: user.id });
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    id: jti,
    userId: user.id,
    refreshExpiresAt: expiresAt,
  });

  return c.json(
    {
      user: { id: user.id, email: user.email, createdAt: user.createdAt },
      accessToken,
      refreshToken,
    },
    201
  );
});

auth.post("/sign-in", zValidator("json", signInSchema), async (c) => {
  const { email, password } = c.req.valid("json");
  const normalizedEmail = email.toLowerCase().trim();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (!user) {
    return c.json({ error: "invalid_credentials" }, 401);
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return c.json({ error: "invalid_credentials" }, 401);
  }

  const accessToken = await signAccessToken({ sub: user.id, email: user.email });
  const { token: refreshToken, jti } = await signRefreshToken({ sub: user.id });
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    id: jti,
    userId: user.id,
    refreshExpiresAt: expiresAt,
  });

  return c.json({
    user: { id: user.id, email: user.email, createdAt: user.createdAt },
    accessToken,
    refreshToken,
  });
});

auth.post("/refresh", zValidator("json", refreshSchema), async (c) => {
  const { refreshToken } = c.req.valid("json");

  let payload;
  try {
    payload = await verifyRefreshToken(refreshToken);
  } catch (e) {
    return c.json({ error: "invalid_refresh_token" }, 401);
  }

  const [session] = await db.select().from(sessions).where(eq(sessions.id, payload.jti)).limit(1);
  if (!session || session.userId !== payload.sub) {
    return c.json({ error: "session_not_found" }, 401);
  }
  if (session.refreshExpiresAt < new Date()) {
    return c.json({ error: "session_expired" }, 401);
  }

  const [user] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
  if (!user) {
    return c.json({ error: "user_not_found" }, 401);
  }

  const accessToken = await signAccessToken({ sub: user.id, email: user.email });
  return c.json({ accessToken });
});

auth.get("/me", requireAuth(), async (c) => {
  const userId = c.get("userId");
  const [user] = await db
    .select({ id: users.id, email: users.email, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return c.json({ error: "user_not_found" }, 404);
  }
  return c.json({ user });
});
