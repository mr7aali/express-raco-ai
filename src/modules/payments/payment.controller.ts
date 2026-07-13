import type { Request, Response } from "express";
import { ApiError } from "../../utils/api-error";
import { paymentService } from "./payment.service";

export class PaymentController {
  async checkout(req: Request, res: Response) {
    if (!req.user) {
      throw new ApiError(401, "Authentication token is required");
    }

    const result = await paymentService.checkout(req.user.id, req.body);

    res.status(201).json({
      success: true,
      message: "Payment initiated successfully",
      data: result,
    });
  }

  async confirmStripePayment(req: Request, res: Response) {
    const result = await paymentService.confirmStripePayment(req.body.transactionId);

    res.status(200).json({
      success: true,
      message: "Stripe payment checked successfully",
      data: result,
    });
  }

  async executeBkashPayment(req: Request, res: Response) {
    const result = await paymentService.executeBkashPayment(req.body.paymentId);

    res.status(200).json({
      success: true,
      message: "bKash payment executed successfully",
      data: result,
    });
  }

  async queryBkashPayment(req: Request, res: Response) {
    const result = await paymentService.queryBkashPayment(req.body.paymentId);

    res.status(200).json({
      success: true,
      message: "bKash payment queried successfully",
      data: result,
    });
  }

  async handleBkashCallback(req: Request, res: Response) {
    const result = await paymentService.handleBkashCallback(
      req.validated?.query?.paymentID as string,
      req.validated?.query?.status as string | undefined,
    );

    res.status(200).json({
      success: true,
      message: "bKash callback handled successfully",
      data: result,
    });
  }

  async handleStripeWebhook(req: Request, res: Response) {
    const signature = req.headers["stripe-signature"];

    const result = await paymentService.handleStripeWebhook(
      req.body,
      Array.isArray(signature) ? signature[0] : signature,
    );

    res.status(200).json({
      success: true,
      message: "Stripe webhook handled successfully",
      data: result,
    });
  }
}

export const paymentController = new PaymentController();
