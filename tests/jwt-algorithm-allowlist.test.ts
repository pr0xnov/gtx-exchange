/**
 * Pre-production audit fix: lib/auth/jwt.ts's verify*Token() functions
 * now pass an explicit `algorithms: ["HS256"]` allowlist to jwt.verify(),
 * instead of accepting whatever algorithm a token's own header claims.
 * Defense-in-depth against algorithm-confusion attacks — not currently
 * exploitable here (everything is symmetric HS256, no RS256/asymmetric
 * key anywhere this app signs with), but a one-line, zero-behavior-change
 * hardening. This confirms: (a) real tokens still round-trip exactly as
 * before, and (b) a token whose header claims a different algorithm is
 * now rejected outright, even when otherwise validly formatted.
 */
import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import { env } from "@/lib/env";
import {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  signTwoFaSetupToken,
  verifyTwoFaSetupToken,
  signLoginChallengeToken,
  verifyLoginChallengeToken,
} from "@/lib/auth/jwt";

describe("JWT round-trip — unchanged behavior for real tokens", () => {
  it("access token", () => {
    const token = signAccessToken({ sub: "user_1", email: "a@example.com" });
    expect(verifyAccessToken(token)).toMatchObject({
      sub: "user_1",
      email: "a@example.com",
    });
  });

  it("refresh token", () => {
    const token = signRefreshToken({ sub: "user_1", tokenId: "tok_1" });
    expect(verifyRefreshToken(token)).toMatchObject({ sub: "user_1", tokenId: "tok_1" });
  });

  it("2FA setup token", () => {
    const token = signTwoFaSetupToken({ sub: "user_1", secret: "TOTPSECRET" });
    expect(verifyTwoFaSetupToken(token)).toMatchObject({
      sub: "user_1",
      secret: "TOTPSECRET",
      purpose: "2fa-setup",
    });
  });

  it("login challenge token", () => {
    const token = signLoginChallengeToken({ sub: "user_1" });
    expect(verifyLoginChallengeToken(token)).toMatchObject({
      sub: "user_1",
      purpose: "login-2fa",
    });
  });
});

describe("JWT algorithm allowlist — rejects a token signed with a different algorithm", () => {
  it("verifyAccessToken rejects an HS384 token, even signed with the correct secret", () => {
    const crossAlgToken = jwt.sign(
      { sub: "attacker", email: "attacker@example.com" },
      env.JWT_ACCESS_SECRET,
      { algorithm: "HS384", expiresIn: "15m" }
    );
    expect(() => verifyAccessToken(crossAlgToken)).toThrow();
  });

  it("verifyRefreshToken rejects an HS384 token, even signed with the correct secret", () => {
    const crossAlgToken = jwt.sign(
      { sub: "attacker", tokenId: "forged" },
      env.JWT_REFRESH_SECRET,
      { algorithm: "HS384", expiresIn: "30d" }
    );
    expect(() => verifyRefreshToken(crossAlgToken)).toThrow();
  });

  it("verifyAccessToken rejects an unsigned ('none' algorithm) token", () => {
    const noneToken = jwt.sign({ sub: "attacker", email: "attacker@example.com" }, "", {
      algorithm: "none",
    });
    expect(() => verifyAccessToken(noneToken)).toThrow();
  });

  it("a genuinely HS256-signed token is unaffected by the allowlist", () => {
    const token = jwt.sign(
      { sub: "user_1", email: "a@example.com" },
      env.JWT_ACCESS_SECRET,
      { algorithm: "HS256", expiresIn: "15m" }
    );
    expect(() => verifyAccessToken(token)).not.toThrow();
  });
});
