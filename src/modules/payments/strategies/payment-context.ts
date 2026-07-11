import type { CreatePaymentInput, PaymentStrategy } from "../payment.types";

export class PaymentContext {
  constructor(private strategy: PaymentStrategy) {}

  setStrategy(strategy: PaymentStrategy) {
    this.strategy = strategy;
  }

  processPayment(order: CreatePaymentInput) {
    return this.strategy.createPayment(order);
  }

  confirmPayment(transactionId: string) {
    return this.strategy.confirmPayment(transactionId);
  }

  handleWebhook(payload: unknown, signature?: string) {
    return this.strategy.handleWebhook(payload, signature);
  }
}
