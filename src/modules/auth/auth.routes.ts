import { Router } from "express";
import { validateRequest } from "../../middlewares/validate-request.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { authController } from "./auth.controller";
import { loginSchema, registerSchema } from "./auth.validation";

export const authRoutes = Router();

authRoutes.post(
  "/register",
  validateRequest(registerSchema),
  asyncHandler(authController.register.bind(authController)),
);

authRoutes.post(
  "/login",
  validateRequest(loginSchema),
  asyncHandler(authController.login.bind(authController)),
);
