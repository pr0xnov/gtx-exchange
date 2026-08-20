import { z } from "zod";
import { SPOT_CURRENCIES } from "@/lib/spot/currencies";

// Balance Adjustment: `amount` is always positive here — which way it
// moves the user's balance is `direction`, never the sign of the number
// itself, so there's no way to "sneak" a debit through the Add Balance
// path by passing a negative amount (see app/api/admin/balance-adjustments).
export const balanceAdjustmentSchema = z.object({
  userId: z.string().min(1, "User is required"),
  asset: z.enum(SPOT_CURRENCIES, { errorMap: () => ({ message: "Unknown asset" }) }),
  amount: z
    .number()
    .finite("Amount must be a real number")
    .positive("Amount must be greater than zero")
    // Matches the Decimal(20, 8) column — anything finer would silently
    // round on write, which is worse than rejecting it up front.
    .refine((n) => Number.isInteger(n * 1e8), "Amount has too many decimal places"),
  direction: z.enum(["CREDIT", "DEBIT"]),
  reason: z.string().trim().min(3, "A reason is required").max(500),
});

export const userStatusUpdateSchema = z.object({
  status: z.enum(["ACTIVE", "BLOCKED", "SUSPENDED"]),
  reason: z.string().trim().max(500).optional(),
});

// Deliberately excludes SUPER_ADMIN — promoting to (or demoting from) the
// top role is not exposed through this simple toggle at all; see
// scripts/create-admin.ts and section 27/16 of this task's own spec on
// keeping that creation path separately controlled.
export const roleUpdateSchema = z.object({
  role: z.enum(["USER", "ADMIN"]),
});

export const verificationDecisionSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  note: z.string().trim().max(500).optional(),
});
