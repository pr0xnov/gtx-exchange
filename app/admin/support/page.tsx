/**
 * There is no support-ticket model/backend anywhere in this app yet (the
 * user-facing /support page is just a contact form that emails out — see
 * components/dashboard/... — it doesn't persist submissions anywhere a
 * ticket queue could read them from). Rather than show fabricated ticket
 * data, this page says so plainly; building a real ticket system is a
 * separate, much larger feature this task didn't ask for.
 */
export default function AdminSupportPage() {
  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Support</h1>
      <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted">
        <p>
          There&apos;s no support-ticket backend in GTX yet — the user-facing Support page
          only sends an email, it doesn&apos;t persist a queue this panel could list.
        </p>
        <p className="mt-3">
          User-reported issues currently arrive by email rather than through this panel.
        </p>
      </div>
    </div>
  );
}
