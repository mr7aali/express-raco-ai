import type { Request, Response } from "express";
import { ApiError } from "../../utils/api-error";
import { getStringParam } from "../../utils/request-param";
import { orderService } from "./order.service";

export class OrderController {
  async create(req: Request, res: Response) {
    if (!req.user) {
      throw new ApiError(401, "Authentication token is required");
    }

    const order = await orderService.create(req.user.id, req.body);

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  }

  async findMine(req: Request, res: Response) {
    if (!req.user) {
      throw new ApiError(401, "Authentication token is required");
    }

    const result = await orderService.findMine(req.user.id, req.query as never);

    res.status(200).json({
      success: true,
      message: "Orders retrieved successfully",
      data: result.orders,
      meta: result.meta,
    });
  }

  async findMineById(req: Request, res: Response) {
    if (!req.user) {
      throw new ApiError(401, "Authentication token is required");
    }

    const order = await orderService.findMineById(req.user.id, getStringParam(req, "id"));

    res.status(200).json({
      success: true,
      message: "Order retrieved successfully",
      data: order,
    });
  }

  async cancelMine(req: Request, res: Response) {
    if (!req.user) {
      throw new ApiError(401, "Authentication token is required");
    }

    const order = await orderService.cancelMine(req.user.id, getStringParam(req, "id"));

    res.status(200).json({
      success: true,
      message: "Order canceled successfully",
      data: order,
    });
  }
}

export const orderController = new OrderController();
