import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate-request.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { paymentController } from "./payment.controller";
import {
  bkashCallbackSchema,
  bkashPaymentIdSchema,
  checkoutSchema,
  transactionSchema,
} from "./payment.validation";

export const paymentRoutes = Router();

paymentRoutes.post(
  "/checkout",
  requireAuth,
  validateRequest(checkoutSchema),
  asyncHandler(paymentController.checkout.bind(paymentController)),
);

paymentRoutes.post(
  "/stripe/confirm",
  requireAuth,
  validateRequest(transactionSchema),
  asyncHandler(paymentController.confirmStripePayment.bind(paymentController)),
);

paymentRoutes.post(
  "/bkash/execute",
  requireAuth,
  validateRequest(bkashPaymentIdSchema),
  asyncHandler(paymentController.executeBkashPayment.bind(paymentController)),
);

paymentRoutes.post(
  "/bkash/query",
  requireAuth,
  validateRequest(bkashPaymentIdSchema),
  asyncHandler(paymentController.queryBkashPayment.bind(paymentController)),
);

paymentRoutes.get(
  "/bkash/callback",
  validateRequest(bkashCallbackSchema),
  asyncHandler(paymentController.handleBkashCallback.bind(paymentController)),
);
