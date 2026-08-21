"use client";

import { useState } from "react";
import { Eye, EyeOff, RotateCcw } from "lucide-react";
import { useRevealUserPassword, useResetUserPassword } from "@/hooks/use-admin-api";
import { Button } from "@/components/ui/button";

interface UserPasswordCellProps {
  userId: string;
  userLabel: string;
  /** Only SUPER_ADMIN ever gets the Show/Hide toggle — a plain ADMIN sees
   *  dots and Reset only, and can never reach the real password even by
   *  calling the API directly (enforced server-side, not just hidden
   *  here — see app/api/admin/users/[id]/password/route.ts). */
  canReveal: boolean;
}

/** Stops a click on this cell's controls from also triggering the parent
 *  row's "open user detail" navigation. */
function stop(e: React.MouseEvent) {
  e.stopPropagation();
}

export function UserPasswordCell({
  userId,
  userLabel,
  canReveal,
}: UserPasswordCellProps) {
  const [revealed, setRevealed] = useState<string | null>(null);
  const [notAvailable, setNotAvailable] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetResult, setResetResult] = useState<string | null>(null);
  const reveal = useRevealUserPassword();
  const reset = useResetUserPassword();

  async function handleShow() {
    setNotAvailable(false);
    const result = await reveal.mutateAsync(userId).catch(() => null);
    if (!result) return;
    if (!result.available || !result.password) {
      setNotAvailable(true);
      return;
    }
    setRevealed(result.password);
  }

  function handleHide() {
    setRevealed(null);
    setNotAvailable(false);
  }

  async function handleConfirmReset() {
    const result = await reset.mutateAsync(userId).catch(() => null);
    if (!result) return;
    setResetResult(result.newPassword);
    // A previously revealed/"not available" state is now stale.
    setRevealed(null);
    setNotAvailable(false);
  }

  return (
    <div className="flex items-center gap-2" onClick={stop}>
      {revealed ? (
        <>
          <code className="font-tabular rounded bg-foreground/5 px-2 py-1 text-xs text-foreground">
            {revealed}
          </code>
          <button
            type="button"
            onClick={handleHide}
            className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
          >
            <EyeOff className="h-3.5 w-3.5" />
            Hide
          </button>
        </>
      ) : (
        <>
          <span className="font-tabular text-muted">
            {notAvailable ? "Not available" : "••••••••"}
          </span>
          {canReveal && (
            <button
              type="button"
              onClick={handleShow}
              disabled={reveal.isPending}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
            >
              <Eye className="h-3.5 w-3.5" />
              {reveal.isPending ? "Loading…" : "Show"}
            </button>
          )}
        </>
      )}

      <button
        type="button"
        onClick={() => setConfirmingReset(true)}
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
        title="Reset password"
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </button>

      {(confirmingReset || resetResult) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={stop}
        >
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6">
            {resetResult ? (
              <>
                <h2 className="text-lg font-semibold text-foreground">Password reset</h2>
                <p className="mt-2 text-sm text-muted">
                  New password for {userLabel} — shown once, copy it now:
                </p>
                <code className="font-tabular mt-3 block break-all rounded-lg bg-foreground/5 px-3 py-2 text-sm text-foreground">
                  {resetResult}
                </code>
                <Button
                  className="mt-4 w-full"
                  onClick={() => {
                    setResetResult(null);
                    setConfirmingReset(false);
                  }}
                >
                  Done
                </Button>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-foreground">Reset password?</h2>
                <p className="mt-2 text-sm text-muted">
                  This generates a new password for {userLabel} and immediately
                  invalidates the old one.
                </p>
                {reset.isError && (
                  <p className="mt-2 text-sm text-danger">
                    Reset failed. Please try again.
                  </p>
                )}
                <div className="mt-4 flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setConfirmingReset(false)}
                    disabled={reset.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={handleConfirmReset}
                    disabled={reset.isPending}
                  >
                    {reset.isPending ? "Resetting…" : "Reset"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
