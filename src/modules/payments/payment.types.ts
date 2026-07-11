import type { PaymentProvider, PaymentStatus } from "../../generated/prisma/enums";

export type PaymentResult = {
  provider: PaymentProvider;
  transactionId: string;
  status: PaymentStatus;
  rawResponse: unknown;
  redirectUrl?: string;
  clientSecret?: string | null;
};

export type CreatePaymentInput = {
  orderId: string;
  userId: string;
  amount: number;
};

export interface PaymentStrategy {
  createPayment(input: CreatePaymentInput): Promise<PaymentResult>;
  confirmPayment(transactionId: string): Promise<PaymentResult>;
  handleWebhook(payload: unknown, signature?: string): Promise<PaymentResult>;
}
