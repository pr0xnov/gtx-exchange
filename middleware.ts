import { NextRequest, NextResponse } from "next/server";
import { LOCALE_COOKIE, resolveLocaleFromAcceptLanguage } from "@/lib/i18n/config";

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
  "/wallet",
  // Only gates "must be logged in at all" — middleware runs on the Edge
  // runtime and can't safely check `role` against the DB (Prisma/bcrypt
  // aren't Edge-safe here, and the access-token JWT deliberately doesn't
  // carry a role claim a stolen/decoded token could spoof). The real
  // role check happens server-side, fresh from the DB, in
  // app/admin/layout.tsx (via requireAdmin()) and independently in every
  // /api/admin/** route — this is just the same "redirect to /login if
  // no session cookie at all" every other protected prefix already gets.
  "/admin",
];

const AUTH_PAGES = ["/login", "/register"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasToken = Boolean(req.cookies.get(ACCESS_COOKIE)?.value);

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  let res: NextResponse;

  if (isProtected && !hasToken) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    res = NextResponse.redirect(url);
  } else if (isAuthPage && hasToken) {
    const url = req.nextUrl.clone();
    url.pathname = "/account";
    res = NextResponse.redirect(url);
  } else {
    res = NextResponse.next();
  }

  // Auto-detect locale from Accept-Language on first visit only. Once a
  // locale cookie exists — set here, or by the manual switcher in
  // components/layout/navbar.tsx — it's never overridden, so a manual
  // choice always sticks across reloads/redirects/new tabs.
  if (!req.cookies.get(LOCALE_COOKIE)?.value) {
    const locale = resolveLocaleFromAcceptLanguage(req.headers.get("accept-language"));
    res.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return res;
}

export const config = {
  // Runs on every page route (locale auto-detection needs to see all of
  // them, not just the protected/auth ones) except static assets and API
  // routes. The auth checks above are unchanged and still only act on
  // PROTECTED_PREFIXES / AUTH_PAGES.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
