import { NextRequest, NextResponse } from "next/server";

const ACCESS_COOKIE = "gtx_access_token";

const PROTECTED_PREFIXES = [
  "/account",
  "/deposit",
  "/withdrawal",
  "/history",
  "/settings",
  "/support",
  "/verification",
  "/trading",
  "/downloads",
  "/wallet",
];

const AUTH_PAGES = ["/login", "/register"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasToken = Boolean(req.cookies.get(ACCESS_COOKIE)?.value);

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  if (isProtected && !hasToken) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && hasToken) {
    const url = req.nextUrl.clone();
    url.pathname = "/account";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/account/:path*",
    "/deposit/:path*",
    "/withdrawal/:path*",
    "/history/:path*",
    "/settings/:path*",
    "/support/:path*",
    "/verification/:path*",
    "/trading/:path*",
    "/downloads/:path*",
    "/wallet/:path*",
    "/login",
    "/register",
  ],
};
