import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate-request.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { productController } from "./product.controller";
import {
  createProductSchema,
  listProductsSchema,
  productIdParamSchema,
  updateProductSchema,
} from "./product.validation";

export const productRoutes = Router();

productRoutes.get(
  "/",
  validateRequest(listProductsSchema),
  asyncHandler(productController.findAll.bind(productController)),
);

productRoutes.get(
  "/:id",
  validateRequest(productIdParamSchema),
  asyncHandler(productController.findById.bind(productController)),
);

productRoutes.get(
  "/:id/recommendations",
  validateRequest(productIdParamSchema),
  asyncHandler(productController.getRecommendations.bind(productController)),
);

productRoutes.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  validateRequest(createProductSchema),
  asyncHandler(productController.create.bind(productController)),
);

productRoutes.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  validateRequest(updateProductSchema),
  asyncHandler(productController.update.bind(productController)),
);

productRoutes.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  validateRequest(productIdParamSchema),
  asyncHandler(productController.delete.bind(productController)),
);
