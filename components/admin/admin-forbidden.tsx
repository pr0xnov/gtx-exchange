import Link from "next/link";
import { ShieldAlert } from "lucide-react";

/**
 * Rendered directly at whatever /admin/** URL a plain USER tried to open
 * — no redirect, so the address bar still reads /admin, matching the
 * spirit of "access denied at this URL". Every /api/admin/** route
 * independently returns a real HTTP 403 (see lib/api-response.ts's
 * handleApiError mapping ForbiddenError -> 403); a plain Next.js Server
 * Component page can't set its own document response status code without
 * an experimental flag, so this is the closest stable equivalent for the
 * page itself — no admin data or UI is ever sent to the client either way.
 */
export function AdminForbidden() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-sm rounded-2xl border border-border bg-card p-8 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-danger" />
        <h1 className="mt-4 text-lg font-semibold text-foreground">403 Forbidden</h1>
        <p className="mt-2 text-sm text-muted">
          You don&apos;t have permission to access the admin panel.
        </p>
        <Link
          href="/account"
          className="mt-6 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          Back to account
        </Link>
      </div>
    </div>
  );
}
