import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { paymentController } from "./payment.controller";

export const stripeWebhookRoutes = Router();

stripeWebhookRoutes.post(
  "/",
  asyncHandler(paymentController.handleStripeWebhook.bind(paymentController)),
);
