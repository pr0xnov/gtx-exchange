import { cookies } from "next/headers";

export const ACCESS_COOKIE = "gtx_access_token";
export const REFRESH_COOKIE = "gtx_refresh_token";

const isProd = process.env.NODE_ENV === "production";

export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const store = await cookies();
  store.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15, // 15 minutes
  });
  store.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearAuthCookies() {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete({ name: REFRESH_COOKIE, path: "/api/auth" } as never);
}

export async function getAccessTokenFromCookies(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(ACCESS_COOKIE)?.value;
}

export async function getRefreshTokenFromCookies(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(REFRESH_COOKIE)?.value;
}
