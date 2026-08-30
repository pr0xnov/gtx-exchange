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

// Deposit/Withdrawal Approve/Reject (app/api/admin/transactions/[id]).
export const transactionDecisionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
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

export const verificationDecisionSchema = z
  .object({
    decision: z.enum(["APPROVED", "REJECTED"]),
    reason: z.string().trim().max(500).optional(),
  })
  .refine((data) => data.decision !== "REJECTED" || (data.reason?.length ?? 0) >= 3, {
    message: "A reason is required when rejecting verification",
    path: ["reason"],
  });

// SUPER_ADMIN editing a user's KYC personal info from the verification
// review screen — every field optional so the frontend's per-field
// Edit/Save can PATCH just the one field it changed, but at least one
// must be present (see the .refine below).
export const adminUpdateVerificationProfileSchema = z
  .object({
    country: z.string().trim().min(1, "Country is required").max(100).optional(),
    firstName: z.string().trim().min(1, "First name is required").max(100).optional(),
    lastName: z.string().trim().min(1, "Last name is required").max(100).optional(),
    dateOfBirth: z
      .string()
      .refine((s) => !Number.isNaN(Date.parse(s)), "Enter a valid date of birth")
      .optional(),
    address: z.string().trim().min(1, "Address is required").max(300).optional(),
    email: z.string().trim().email("Enter a valid email").max(200).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "No fields to update" });
