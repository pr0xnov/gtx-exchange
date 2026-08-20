import { z } from "zod";
import { LOCALES } from "@/lib/i18n/config";
import { THEMES } from "@/lib/theme/config";

export const profileUpdateSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  lastName: z.string().trim().min(1, "Last name is required").max(50),
});

// Same strength requirements as registration (lib/validation/auth.ts) — kept
// in sync deliberately; a password acceptable at signup should be
// acceptable when changing to it later.
const newPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a number");

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: newPasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const requestEmailChangeSchema = z.object({
  newEmail: z.string().trim().toLowerCase().email("Enter a valid email"),
  currentPassword: z.string().min(1, "Current password is required"),
});

export const totpCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export const disable2faSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export const preferencesUpdateSchema = z
  .object({
    language: z.enum(LOCALES).optional(),
    theme: z.enum(THEMES).optional(),
    notifyEmail: z.boolean().optional(),
    notifyPush: z.boolean().optional(),
    notifyMarket: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "No preferences supplied",
  });
