import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { maybeEncryptPassword } from "@/lib/auth/password-crypto";
import {
  signAccessToken,
  signRefreshToken,
  refreshTokenExpiryDate,
} from "@/lib/auth/jwt";
import { setAuthCookies } from "@/lib/auth/cookies";
import { registerSchema } from "@/lib/validation/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { getTrustedClientIp, getDeviceHash } from "@/lib/security/client-ip";
import { generateLoginId } from "@/lib/utils";
import { SPOT_CURRENCIES } from "@/lib/spot/currencies";
import { generateReferralCode, normalizeReferralCode } from "@/lib/referral/code";

const MAX_REFERRAL_CODE_GENERATION_ATTEMPTS = 5;

function createUser(params: {
  input: { firstName: string; lastName: string; email: string };
  passwordHash: string;
  encryptedPassword: string | null;
  referrerId: string | null;
  referralCode: string;
  lastKnownIp: string | null;
  lastKnownDeviceHash: string | null;
}) {
  const {
    input,
    passwordHash,
    encryptedPassword,
    referrerId,
    referralCode,
    lastKnownIp,
    lastKnownDeviceHash,
  } = params;
  return prisma.user.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      passwordHash,
      encryptedPassword,
      login: generateLoginId(),
      referralCode,
      referredById: referrerId,
      lastKnownIp,
      lastKnownDeviceHash,
      wallet: { create: { balance: 0, credit: 0, currency: "USDT" } },
      settings: { create: {} },
      // Spot wallet is a separate ledger from the futures margin wallet
      // above — it can never be spent or margined by futures trades and
      // vice versa. New accounts start at 0 in both.
      spotWallets: {
        create: SPOT_CURRENCIES.map((currency) => ({
          currency,
          balance: 0,
        })),
      },
    },
    include: { wallet: true },
  });
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const limit = rateLimit(`register:${ip}`, 5, 60_000);
    if (!limit.success) {
      return apiError("Too many registration attempts. Please try again shortly.", 429);
    }

    const body = await req.json();
    const input = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      return apiError("An account with this email already exists", 409);
    }

    // Optional referral code: a non-empty value MUST resolve to a real
    // user's code, or registration is rejected outright — never silently
    // ignored (a typo'd code should never quietly become "no referral").
    // Self-referral is structurally impossible here: the referrer is
    // looked up among EXISTING users, and this new user doesn't have an
    // id (let alone a referralCode) yet.
    let referrerId: string | null = null;
    if (input.referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: normalizeReferralCode(input.referralCode) },
        select: { id: true },
      });
      if (!referrer) {
        return apiError("Invalid referral code", 422, {
          referralCode: ["INVALID_REFERRAL_CODE"],
        });
      }
      referrerId = referrer.id;
    }

    const passwordHash = await hashPassword(input.password);
    const encryptedPassword = maybeEncryptPassword(input.password);

    const lastKnownIp = getTrustedClientIp(req.headers);
    const lastKnownDeviceHash = getDeviceHash(req.headers);

    let user: Awaited<ReturnType<typeof createUser>> | undefined;
    for (let attempt = 0; attempt < MAX_REFERRAL_CODE_GENERATION_ATTEMPTS; attempt++) {
      try {
        user = await createUser({
          input,
          passwordHash,
          encryptedPassword,
          referrerId,
          referralCode: generateReferralCode(),
          lastKnownIp,
          lastKnownDeviceHash,
        });
        break;
      } catch (err) {
        const isReferralCodeCollision =
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002" &&
          (err.meta?.target as string[] | undefined)?.includes("referralCode");
        if (!isReferralCodeCollision) throw err;
        // Astronomically rare (32^6 code space) — retry with a fresh
        // random code rather than fail registration outright.
      }
    }
    if (!user) {
      return apiError("Could not create account, please try again", 500);
    }

    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshRecord = await prisma.refreshToken.create({
      data: {
        token: "",
        userId: user.id,
        expiresAt: refreshTokenExpiryDate(),
      },
    });
    const refreshToken = signRefreshToken({ sub: user.id, tokenId: refreshRecord.id });
    await prisma.refreshToken.update({
      where: { id: refreshRecord.id },
      data: { token: refreshToken },
    });

    await setAuthCookies(accessToken, refreshToken);

    return apiSuccess(
      {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          login: user.login,
        },
        wallet: user.wallet,
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
