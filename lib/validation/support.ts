import { z } from "zod";
import { SupportCategory } from "@prisma/client";

export const createConversationSchema = z.object({
  category: z.nativeEnum(SupportCategory, {
    errorMap: () => ({ message: "Choose a category" }),
  }),
});

export const sendSupportMessageSchema = z.object({
  message: z.string().trim().min(1, "Message is required").max(2000),
});

export const closeConversationSchema = z.object({
  status: z.enum(["OPEN", "CLOSED"]),
});
