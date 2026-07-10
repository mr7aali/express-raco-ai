import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { userController } from "./user.controller";

export const userRoutes = Router();

userRoutes.get("/me", requireAuth, asyncHandler(userController.getMe.bind(userController)));
userRoutes.get(
  "/me/orders",
  requireAuth,
  asyncHandler(userController.getMyOrders.bind(userController)),
);
userRoutes.get(
  "/me/payments",
  requireAuth,
  asyncHandler(userController.getMyPayments.bind(userController)),
);
