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

export const depositSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0").max(10_000_000),
  method: z.enum(["VISA_MASTERCARD", "BANK_TRANSFER", "BITCOIN", "TETHER_USDT"]),
});

export const withdrawSchema = z.object({
  amount: z.number().min(50, "Minimum withdrawal amount is 50 USD"),
  method: z.enum(["VISA_MASTERCARD", "BANK_TRANSFER", "BITCOIN", "TETHER_USDT"]),
});

export const verificationSchema = z.object({
  identityFileName: z.string().min(1, "Identity document is required"),
  addressFileName: z.string().min(1, "Proof of address is required"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type DepositInput = z.infer<typeof depositSchema>;
export type WithdrawInput = z.infer<typeof withdrawSchema>;
export type CreateSpotOrderInput = z.infer<typeof createSpotOrderSchema>;
