import type { Request, Response } from "express";
import { authService } from "./auth.service";

export class AuthController {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result,
    });
  }

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body);

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: result,
    });
  }
}

export const authController = new AuthController();
