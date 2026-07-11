import { z } from "zod";

const providerSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(z.enum(["STRIPE", "BKASH"]));

export const checkoutSchema = z.object({
  body: z.object({
    orderId: z.string().uuid(),
    provider: providerSchema,
  }),
});

export const transactionSchema = z.object({
  body: z.object({
    transactionId: z.string().trim().min(1),
  }),
});

export const bkashPaymentIdSchema = z.object({
  body: z.object({
    paymentId: z.string().trim().min(1),
  }),
});

export const bkashCallbackSchema = z.object({
  query: z.object({
    paymentID: z.string().trim().min(1),
    status: z.string().trim().optional(),
  }),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>["body"];
export type BkashCallbackQuery = z.infer<typeof bkashCallbackSchema>["query"];
