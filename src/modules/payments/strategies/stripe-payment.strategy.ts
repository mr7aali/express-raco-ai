import Stripe from "stripe";
import { env } from "../../../config/env";
import { ApiError } from "../../../utils/api-error";
import type { CreatePaymentInput, PaymentResult, PaymentStrategy } from "../payment.types";

export class StripePaymentStrategy implements PaymentStrategy {
  private readonly stripe = new Stripe(env.stripeSecretKey);

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: this.toSmallestCurrencyUnit(input.amount),
      currency: env.stripeCurrency,
      metadata: {
        orderId: input.orderId,
        userId: input.userId,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      provider: "STRIPE",
      transactionId: paymentIntent.id,
      status: this.mapPaymentIntentStatus(paymentIntent.status),
      rawResponse: paymentIntent,
      clientSecret: paymentIntent.client_secret,
    };
  }

  async confirmPayment(transactionId: string): Promise<PaymentResult> {
    const paymentIntent = await this.stripe.paymentIntents.retrieve(transactionId);

    return {
      provider: "STRIPE",
      transactionId: paymentIntent.id,
      status: this.mapPaymentIntentStatus(paymentIntent.status),
      rawResponse: paymentIntent,
      clientSecret: paymentIntent.client_secret,
    };
  }

  async handleWebhook(payload: unknown, signature?: string): Promise<PaymentResult> {
    if (!Buffer.isBuffer(payload)) {
      throw new ApiError(400, "Stripe webhook payload must be raw request body");
    }

    if (!signature) {
      throw new ApiError(400, "Stripe signature header is required");
    }

    const event = this.stripe.webhooks.constructEvent(payload, signature, env.stripeWebhookSecret);

    if (
      event.type !== "payment_intent.succeeded" &&
      event.type !== "payment_intent.payment_failed"
    ) {
      throw new ApiError(400, `Unsupported Stripe webhook event: ${event.type}`);
    }

    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    return {
      provider: "STRIPE",
      transactionId: paymentIntent.id,
      status: event.type === "payment_intent.succeeded" ? "SUCCESS" : "FAILED",
      rawResponse: event,
      clientSecret: paymentIntent.client_secret,
    };
  }

  private toSmallestCurrencyUnit(amount: number) {
    return Math.round(amount * 100);
  }

  private mapPaymentIntentStatus(status: Stripe.PaymentIntent.Status) {
    if (status === "succeeded") {
      return "SUCCESS";
    }

    if (status === "canceled") {
      return "FAILED";
    }

    return "PENDING";
  }
}
