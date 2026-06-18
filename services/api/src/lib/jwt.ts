/**
 * JWT — jose lib, HS256, separate access + refresh signing keys.
 * Access: 15min, used as Bearer token.
 * Refresh: 30d, used to mint new access tokens; tracked in sessions table.
 */
import { SignJWT, jwtVerify } from "jose";
import { randomUUID } from "node:crypto";

const ISSUER = "chainmail-api";
const AUDIENCE = "chainmail-web";

const ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET ?? "dev-access-secret-change-in-prod-32chars-min"
);
const REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret-change-in-prod-32chars-min"
);

const ACCESS_TTL = "15m";
const REFRESH_TTL = "30d";

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TTL)
    .sign(ACCESS_SECRET);
}

export async function signRefreshToken(payload: { sub: string }): Promise<{
  token: string;
  jti: string;
}> {
  const jti = randomUUID();
  const token = await new SignJWT({ jti })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(REFRESH_TTL)
    .sign(REFRESH_SECRET);
  return { token, jti };
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, ACCESS_SECRET, {
    issuer: ISSUER,
    audience: AUDIENCE,
  });
  if (!payload.sub || !payload.email) {
    throw new Error("invalid_payload");
  }
  return { sub: payload.sub, email: payload.email as string };
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, REFRESH_SECRET, {
    issuer: ISSUER,
    audience: AUDIENCE,
  });
  if (!payload.sub || !payload.jti) {
    throw new Error("invalid_payload");
  }
  return { sub: payload.sub, jti: payload.jti as string };
}
