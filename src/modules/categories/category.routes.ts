import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate-request.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { categoryController } from "./category.controller";
import {
  categoryIdParamSchema,
  createCategorySchema,
  updateCategorySchema,
} from "./category.validation";

export const categoryRoutes = Router();

categoryRoutes.get("/", asyncHandler(categoryController.findAll.bind(categoryController)));

categoryRoutes.get(
  "/:id",
  validateRequest(categoryIdParamSchema),
  asyncHandler(categoryController.findById.bind(categoryController)),
);

categoryRoutes.get(
  "/:id/children",
  validateRequest(categoryIdParamSchema),
  asyncHandler(categoryController.getChildren.bind(categoryController)),
);

categoryRoutes.get(
  "/:id/products",
  validateRequest(categoryIdParamSchema),
  asyncHandler(categoryController.getProductsInTree.bind(categoryController)),
);

categoryRoutes.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  validateRequest(createCategorySchema),
  asyncHandler(categoryController.create.bind(categoryController)),
);

categoryRoutes.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  validateRequest(updateCategorySchema),
  asyncHandler(categoryController.update.bind(categoryController)),
);

categoryRoutes.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  validateRequest(categoryIdParamSchema),
  asyncHandler(categoryController.delete.bind(categoryController)),
);
