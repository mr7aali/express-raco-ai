import type { Request, Response } from "express";
import { getStringParam } from "../../utils/request-param";
import { categoryService } from "./category.service";

export class CategoryController {
  async create(req: Request, res: Response) {
    const category = await categoryService.create(req.body);

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  }

  async update(req: Request, res: Response) {
    const category = await categoryService.update(getStringParam(req, "id"), req.body);

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  }

  async delete(req: Request, res: Response) {
    await categoryService.delete(getStringParam(req, "id"));

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  }

  async findAll(_req: Request, res: Response) {
    const categories = await categoryService.findAll();

    res.status(200).json({
      success: true,
      message: "Categories retrieved successfully",
      data: categories,
    });
  }

  async findById(req: Request, res: Response) {
    const category = await categoryService.findById(getStringParam(req, "id"));

    res.status(200).json({
      success: true,
      message: "Category retrieved successfully",
      data: category,
    });
  }

  async getChildren(req: Request, res: Response) {
    const categories = await categoryService.getChildren(getStringParam(req, "id"));

    res.status(200).json({
      success: true,
      message: "Child categories retrieved successfully",
      data: categories,
    });
  }

  async getProductsInTree(req: Request, res: Response) {
    const products = await categoryService.getProductsInTree(getStringParam(req, "id"));

    res.status(200).json({
      success: true,
      message: "Category tree products retrieved successfully",
      data: products,
    });
  }
}

export const categoryController = new CategoryController();
