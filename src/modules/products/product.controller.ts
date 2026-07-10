import type { Request, Response } from "express";
import { getStringParam } from "../../utils/request-param";
import { productService } from "./product.service";

export class ProductController {
  async create(req: Request, res: Response) {
    const product = await productService.create(req.body);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  }

  async update(req: Request, res: Response) {
    const product = await productService.update(getStringParam(req, "id"), req.body);

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  }

  async delete(req: Request, res: Response) {
    await productService.delete(getStringParam(req, "id"));

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  }

  async findAll(req: Request, res: Response) {
    const result = await productService.findAll(req.query as never);

    res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      data: result.products,
      meta: result.meta,
    });
  }

  async findById(req: Request, res: Response) {
    const product = await productService.findById(getStringParam(req, "id"));

    res.status(200).json({
      success: true,
      message: "Product retrieved successfully",
      data: product,
    });
  }

  async getRecommendations(req: Request, res: Response) {
    const products = await productService.getRecommendations(getStringParam(req, "id"));

    res.status(200).json({
      success: true,
      message: "Product recommendations retrieved successfully",
      data: products,
    });
  }
}

export const productController = new ProductController();
