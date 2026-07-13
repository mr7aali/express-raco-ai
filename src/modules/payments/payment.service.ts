import type { Prisma } from "../../generated/prisma/client";
import type { PaymentProvider } from "../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";
import { orderService } from "../orders/order.service";
import type { PaymentResult, PaymentStrategy } from "./payment.types";
import type { CheckoutInput } from "./payment.validation";
import { BkashPaymentStrategy } from "./strategies/bkash-payment.strategy";
import { PaymentContext } from "./strategies/payment-context";
import { StripePaymentStrategy } from "./strategies/stripe-payment.strategy";

export class PaymentService {
  async checkout(userId: string, input: CheckoutInput) {
    const order = await prisma.order.findFirst({
      where: {
        id: input.orderId,
        userId,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    if (order.status !== "PENDING") {
      throw new ApiError(409, "Only pending orders can be checked out");
    }

    if (order.items.length === 0) {
      throw new ApiError(400, "Order has no items");
    }

    const strategy = this.getStrategy(input.provider);
    const context = new PaymentContext(strategy);
    const result = await context.processPayment({
      orderId: order.id,
      userId,
      amount: order.totalAmount.toNumber(),
    });

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: result.provider,
        transactionId: result.transactionId,
        status: result.status,
        rawResponse: this.toJson(result.rawResponse),
      },
    });

    return {
      payment,
      clientSecret: result.clientSecret,
      redirectUrl: result.redirectUrl,
    };
  }

  async confirmStripePayment(transactionId: string) {
    const context = new PaymentContext(new StripePaymentStrategy());
    const result = await context.confirmPayment(transactionId);
    return this.applyPaymentResult(result);
  }

  async executeBkashPayment(paymentId: string) {
    const strategy = new BkashPaymentStrategy();
    const result = await strategy.executePayment(paymentId);
    return this.applyPaymentResult(result);
  }

  async queryBkashPayment(paymentId: string) {
    const strategy = new BkashPaymentStrategy();
    const result = await strategy.queryPayment(paymentId);
    return this.applyPaymentResult(result);
  }

  async handleStripeWebhook(payload: Buffer, signature?: string) {
    const context = new PaymentContext(new StripePaymentStrategy());
    const result = await context.handleWebhook(payload, signature);
    return this.applyPaymentResult(result);
  }

  async handleBkashCallback(paymentId: string, status?: string) {
    if (status && status.toLowerCase() !== "success") {
      const payment = await prisma.payment.findUnique({
        where: { transactionId: paymentId },
      });

      if (!payment) {
        throw new ApiError(404, "Payment record not found");
      }

      return prisma.payment.update({
        where: { transactionId: paymentId },
        data: {
          status: "FAILED",
          rawResponse: this.toJson({ paymentID: paymentId, status }),
        },
      });
    }

    return this.executeBkashPayment(paymentId);
  }

  private async applyPaymentResult(result: PaymentResult) {
    const payment = await prisma.payment.findUnique({
      where: {
        transactionId: result.transactionId,
      },
    });

    if (!payment) {
      throw new ApiError(404, "Payment record not found");
    }

    const updatedPayment = await prisma.payment.update({
      where: {
        transactionId: result.transactionId,
      },
      data: {
        status: result.status,
        rawResponse: this.toJson(result.rawResponse),
      },
    });

    if (result.status === "SUCCESS") {
      await orderService.markAsPaid(payment.orderId);
    }

    return {
      payment: updatedPayment,
      clientSecret: result.clientSecret,
      redirectUrl: result.redirectUrl,
    };
  }

  private getStrategy(provider: PaymentProvider): PaymentStrategy {
    if (provider === "STRIPE") {
      return new StripePaymentStrategy();
    }

    if (provider === "BKASH") {
      return new BkashPaymentStrategy();
    }

    throw new ApiError(400, "Unsupported payment provider");
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}

export const paymentService = new PaymentService();
