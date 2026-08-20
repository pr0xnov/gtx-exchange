import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";

type TxClient = Prisma.TransactionClient | PrismaClient;

/**
 * Every admin action and security-relevant user event funnels through
 * this one function — there is no update/delete counterpart anywhere in
 * the app, which is what makes AuditLog append-only in practice, not just
 * in name. `adminId` is omitted for a plain user's own event (login,
 * logout, password change, 2FA toggle); present for anything an admin did
 * to (or for) an account, themselves included.
 *
 * Accepts an optional transaction client so a critical action's audit
 * entry can be written atomically alongside the action itself (see
 * app/api/admin/balance-adjustments/route.ts) — if the surrounding
 * transaction rolls back, the audit entry never existed either, which is
 * correct: a log entry for something that didn't actually happen would be
 * worse than no entry at all.
 */
export async function createAuditLog(
  params: {
    adminId?: string | null;
    targetUserId?: string | null;
    action: string;
    metadata?: Record<string, unknown> | null;
    ipAddress?: string | null;
  },
  tx: TxClient = prisma
) {
  await tx.auditLog.create({
    data: {
      adminId: params.adminId ?? null,
      targetUserId: params.targetUserId ?? null,
      action: params.action,
      metadata: (params.metadata as Prisma.InputJsonValue | undefined) ?? undefined,
      ipAddress: params.ipAddress ?? null,
    },
  });
}
