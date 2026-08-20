import { getOptionalUser } from "@/lib/auth/session";

/**
 * Deliberately separate from the user-facing /settings (see
 * app/(dashboard)/settings/page.tsx) — this is the admin's own account
 * context inside the Admin Panel, not a duplicate of it. Platform-wide
 * configuration (rate limits, supported assets, etc.) isn't backed by a
 * settings table anywhere in this app yet, so rather than fake controls
 * that don't persist anywhere, this page stays limited to what's real
 * today: the signed-in admin's own identity and role.
 */
export default async function AdminSettingsPage() {
  const user = await getOptionalUser();

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Distinct from the regular user Settings page — this is the admin panel&apos;s
          own context, not shared with it.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted">Signed in as</dt>
            <dd className="mt-1 text-sm text-foreground">
              {user?.firstName} {user?.lastName}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Email</dt>
            <dd className="mt-1 text-sm text-foreground">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Role</dt>
            <dd className="mt-1 text-sm text-foreground">{user?.role}</dd>
          </div>
        </dl>
      </div>

      <p className="text-xs text-muted">
        Password, 2FA, language, and theme for this account are managed from the regular{" "}
        <a href="/settings" className="text-primary hover:underline">
          Settings
        </a>{" "}
        page — the same one every account uses, admin or not.
      </p>
    </div>
  );
}
