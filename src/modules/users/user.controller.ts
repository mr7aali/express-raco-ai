import type { Request, Response } from "express";
import { ApiError } from "../../utils/api-error";
import { userService } from "./user.service";

export class UserController {
  async getMe(req: Request, res: Response) {
    if (!req.user) {
      throw new ApiError(401, "Authentication token is required");
    }

    const user = await userService.getUserById(req.user.id);

    res.status(200).json({
      success: true,
      message: "Current user retrieved successfully",
      data: user,
    });
  }

  async getMyOrders(req: Request, res: Response) {
    if (!req.user) {
      throw new ApiError(401, "Authentication token is required");
    }

    const orders = await userService.getMyOrders(req.user.id);

    res.status(200).json({
      success: true,
      message: "User orders retrieved successfully",
      data: orders,
    });
  }

  async getMyPayments(req: Request, res: Response) {
    if (!req.user) {
      throw new ApiError(401, "Authentication token is required");
    }

    const payments = await userService.getMyPayments(req.user.id);

    res.status(200).json({
      success: true,
      message: "User payments retrieved successfully",
      data: payments,
    });
  }
}

export const userController = new UserController();
