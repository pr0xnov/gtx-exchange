import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth/session";
import { adminUpdateVerificationProfileSchema } from "@/lib/validation/admin";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit/log";
import { getClientIp } from "@/lib/rate-limit";
import type { Prisma } from "@prisma/client";

/**
 * SUPER_ADMIN-only edit of the personal info shown on the verification
 * review screen (Country/Full name/Date of birth/Address/Email) — every
 * field lives on the real User model (see prisma/schema.prisma), never a
 * separate/parallel copy, so an edit here is immediately what
 * GET /api/admin/verification/[userId], the user's own /verification
 * page, and /account all read. Every field the caller actually changed
 * (compared against the current DB value, not just "was it in the
 * request") gets its own ADMIN_UPDATED_USER_VERIFICATION_DATA audit
 * entry with old/new value — no passwords or other secrets ever pass
 * through this endpoint.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await requireSuperAdmin();
    const { userId } = await params;

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) return apiError("User not found", 404);

    const body = await req.json();
    const input = adminUpdateVerificationProfileSchema.parse(body);

    if (input.email !== undefined && input.email !== target.email) {
      const existing = await prisma.user.findUnique({ where: { email: input.email } });
      if (existing) return apiError("This email is already in use", 409);
    }

    const changes: { field: string; oldValue: string | null; newValue: string | null }[] =
      [];
    const data: Prisma.UserUpdateInput = {};

    if (input.country !== undefined && input.country !== (target.country ?? "")) {
      changes.push({
        field: "country",
        oldValue: target.country,
        newValue: input.country,
      });
      data.country = input.country;
    }
    if (input.firstName !== undefined && input.firstName !== target.firstName) {
      changes.push({
        field: "firstName",
        oldValue: target.firstName,
        newValue: input.firstName,
      });
      data.firstName = input.firstName;
    }
    if (input.lastName !== undefined && input.lastName !== target.lastName) {
      changes.push({
        field: "lastName",
        oldValue: target.lastName,
        newValue: input.lastName,
      });
      data.lastName = input.lastName;
    }
    if (input.address !== undefined && input.address !== (target.address ?? "")) {
      changes.push({
        field: "address",
        oldValue: target.address,
        newValue: input.address,
      });
      data.address = input.address;
    }
    if (input.email !== undefined && input.email !== target.email) {
      changes.push({ field: "email", oldValue: target.email, newValue: input.email });
      data.email = input.email;
      // An admin directly setting the live email supersedes any
      // self-service change the user had in flight (Settings > Profile) —
      // leaving a stale pending token around would just be confusing.
      data.pendingEmail = null;
      data.emailChangeTokenHash = null;
      data.emailChangeExpiresAt = null;
    }
    if (input.dateOfBirth !== undefined) {
      const oldDobStr = target.dateOfBirth
        ? target.dateOfBirth.toISOString().slice(0, 10)
        : null;
      if (input.dateOfBirth !== oldDobStr) {
        changes.push({
          field: "dateOfBirth",
          oldValue: oldDobStr,
          newValue: input.dateOfBirth,
        });
        data.dateOfBirth = new Date(input.dateOfBirth);
      }
    }

    if (changes.length === 0) {
      return apiSuccess({ updated: false, changes: [] });
    }

    const ip = getClientIp(req.headers);
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data });
      for (const change of changes) {
        await createAuditLog(
          {
            adminId: admin.id,
            targetUserId: userId,
            action: "ADMIN_UPDATED_USER_VERIFICATION_DATA",
            metadata: change,
            ipAddress: ip,
          },
          tx
        );
      }
    });

    return apiSuccess({ updated: true, changes: changes.map((c) => c.field) });
  } catch (error) {
    return handleApiError(error);
  }
}
