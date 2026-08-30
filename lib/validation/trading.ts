import { z } from "zod";

export const createOrderSchema = z
  .object({
    symbol: z.string().min(1),
    type: z.enum(["MARKET", "LIMIT"]),
    side: z.enum(["BUY", "SELL"]),
    amount: z.number().positive("Amount must be greater than 0"),
    leverage: z.number().int().min(1).max(100).default(1),
    limitPrice: z.number().positive().optional(),
    takeProfit: z.number().positive().optional(),
    stopLoss: z.number().positive().optional(),
  })
  .refine((data) => data.type !== "LIMIT" || data.limitPrice !== undefined, {
    message: "Limit price is required for limit orders",
    path: ["limitPrice"],
  });

export const closePositionSchema = z.object({
  positionId: z.string().min(1),
});

export const createSpotOrderSchema = z
  .object({
    symbol: z.string().min(1),
    side: z.enum(["BUY", "SELL"]),
    type: z.enum(["MARKET", "LIMIT"]),
    quantity: z.number().positive("Quantity must be greater than 0"),
    price: z.number().positive().optional(),
  })
  .refine((data) => data.type !== "LIMIT" || data.price !== undefined, {
    message: "Price is required for limit orders",
    path: ["price"],
  });

// Only Tether (USDT) is offered for now — see components/dashboard/
// payment-method-selector.tsx.
export const depositSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0").max(10_000_000),
  method: z.enum(["TETHER_USDT"]),
});

export const withdrawSchema = z.object({
  amount: z.number().min(50, "Minimum withdrawal amount is 50 USD"),
  method: z.enum(["TETHER_USDT"]),
});

// Personal info fields collected on submission (multipart form — see
// app/api/verification/route.ts). The two document files themselves are
// validated separately in the route (size/MIME type checks don't fit zod's
// string-based validators cleanly).
export const verificationSchema = z.object({
  country: z.string().trim().min(1, "Country is required").max(100),
  dateOfBirth: z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), "Enter a valid date of birth"),
  address: z.string().trim().min(1, "Address is required").max(300),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type DepositInput = z.infer<typeof depositSchema>;
export type WithdrawInput = z.infer<typeof withdrawSchema>;
export type CreateSpotOrderInput = z.infer<typeof createSpotOrderSchema>;
