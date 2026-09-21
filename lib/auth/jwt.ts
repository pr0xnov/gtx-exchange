import jwt from "jsonwebtoken";
import { env } from "@/lib/env";

export interface AccessTokenPayload {
  sub: string; // userId
  email: string;
}

export interface RefreshTokenPayload {
  sub: string;
  tokenId: string;
}

/** 2FA setup (Settings > Security > Enable 2FA): carries the freshly
 *  generated TOTP secret from setup -> enable without ever writing it to
 *  the database until a real code proves the user actually scanned it. */
export interface TwoFaSetupTokenPayload {
  sub: string;
  secret: string;
  purpose: "2fa-setup";
}

/** Login 2FA challenge: issued after a correct password when the account
 *  has 2FA on, in place of real session tokens — proves the password step
 *  already passed without granting a session until the TOTP step also
 *  passes. */
export interface LoginChallengeTokenPayload {
  sub: string;
  purpose: "login-2fa";
}

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_DAYS = 30;
const TWO_FA_SETUP_TTL = "10m";
const LOGIN_CHALLENGE_TTL = "5m";

// Every token this app issues is signed with a plain string secret, which
// jsonwebtoken already defaults to HS256 for — this doesn't change what
// any existing token looks like or invalidate it. What it does add: every
// verify() call below now explicitly refuses any *other* algorithm a
// crafted token might claim in its header, rather than accepting whatever
// jsonwebtoken decides to honor by default. Not currently exploitable
// (there's no RS256/asymmetric key anywhere in this app for a forged
// HS256-with-the-public-key-as-secret token to abuse), but pinning this
// explicitly is a one-line defense-in-depth against that entire class of
// "alg confusion" attack, and free of behavioral change today.
const JWT_ALGORITHM = "HS256" as const;

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    algorithm: JWT_ALGORITHM,
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

/** Rejects anything bearing a `purpose` claim — real access tokens never
 *  set one, so this refuses to treat a 2FA-setup or login-challenge token
 *  (signed with the same secret) as a valid session, even though the
 *  signature alone would otherwise verify fine. */
export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    algorithms: [JWT_ALGORITHM],
  }) as AccessTokenPayload & { purpose?: string };
  if (payload.purpose) throw new Error("Not an access token");
  return payload;
}

export function signTwoFaSetupToken(
  payload: Omit<TwoFaSetupTokenPayload, "purpose">
): string {
  return jwt.sign({ ...payload, purpose: "2fa-setup" }, env.JWT_ACCESS_SECRET, {
    algorithm: JWT_ALGORITHM,
    expiresIn: TWO_FA_SETUP_TTL,
  });
}

export function verifyTwoFaSetupToken(token: string): TwoFaSetupTokenPayload {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    algorithms: [JWT_ALGORITHM],
  }) as TwoFaSetupTokenPayload;
  if (payload.purpose !== "2fa-setup") throw new Error("Not a 2FA setup token");
  return payload;
}

export function signLoginChallengeToken(
  payload: Omit<LoginChallengeTokenPayload, "purpose">
): string {
  return jwt.sign({ ...payload, purpose: "login-2fa" }, env.JWT_ACCESS_SECRET, {
    algorithm: JWT_ALGORITHM,
    expiresIn: LOGIN_CHALLENGE_TTL,
  });
}

export function verifyLoginChallengeToken(token: string): LoginChallengeTokenPayload {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    algorithms: [JWT_ALGORITHM],
  }) as LoginChallengeTokenPayload;
  if (payload.purpose !== "login-2fa") throw new Error("Not a login challenge token");
  return payload;
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    algorithm: JWT_ALGORITHM,
    expiresIn: `${REFRESH_TOKEN_TTL_DAYS}d`,
  });
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    algorithms: [JWT_ALGORITHM],
  }) as RefreshTokenPayload;
}

export function refreshTokenExpiryDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + REFRESH_TOKEN_TTL_DAYS);
  return d;
}
