import type {
  CreatePaymentInput,
  PaymentResult,
  PaymentStrategy,
} from "../src/modules/payments/payment.types";
import { PaymentContext } from "../src/modules/payments/strategies/payment-context";

function createStrategy(result: PaymentResult): jest.Mocked<PaymentStrategy> {
  return {
    createPayment: jest.fn().mockResolvedValue(result),
    confirmPayment: jest.fn().mockResolvedValue(result),
    handleWebhook: jest.fn().mockResolvedValue(result),
  };
}

describe("PaymentContext", () => {
  const paymentInput: CreatePaymentInput = {
    orderId: "33333333-3333-4333-8333-333333333333",
    userId: "44444444-4444-4444-8444-444444444444",
    amount: 718.99,
  };

  const stripeResult: PaymentResult = {
    provider: "STRIPE",
    transactionId: "pi_test_123",
    status: "PENDING",
    rawResponse: { provider: "stripe" },
    clientSecret: "pi_test_123_secret_abc",
  };

  const bkashResult: PaymentResult = {
    provider: "BKASH",
    transactionId: "bkash_test_123",
    status: "PENDING",
    rawResponse: { provider: "bkash" },
    redirectUrl: "https://sandbox.bkash.example/checkout",
  };

  it("delegates payment creation to the active strategy", async () => {
    const strategy = createStrategy(stripeResult);
    const context = new PaymentContext(strategy);

    await expect(context.processPayment(paymentInput)).resolves.toEqual(stripeResult);
    expect(strategy.createPayment).toHaveBeenCalledWith(paymentInput);
  });

  it("can switch strategies without changing checkout flow code", async () => {
    const stripeStrategy = createStrategy(stripeResult);
    const bkashStrategy = createStrategy(bkashResult);
    const context = new PaymentContext(stripeStrategy);

    context.setStrategy(bkashStrategy);

    await expect(context.processPayment(paymentInput)).resolves.toEqual(bkashResult);
    expect(stripeStrategy.createPayment).not.toHaveBeenCalled();
    expect(bkashStrategy.createPayment).toHaveBeenCalledWith(paymentInput);
  });

  it("delegates confirmations and webhooks", async () => {
    const strategy = createStrategy(stripeResult);
    const context = new PaymentContext(strategy);
    const payload = Buffer.from("{}");

    await expect(context.confirmPayment("pi_test_123")).resolves.toEqual(stripeResult);
    await expect(context.handleWebhook(payload, "sig_test")).resolves.toEqual(stripeResult);

    expect(strategy.confirmPayment).toHaveBeenCalledWith("pi_test_123");
    expect(strategy.handleWebhook).toHaveBeenCalledWith(payload, "sig_test");
  });
});
