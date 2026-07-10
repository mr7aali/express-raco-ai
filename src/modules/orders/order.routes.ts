import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate-request.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { orderController } from "./order.controller";
import { createOrderSchema, listOrdersSchema, orderIdParamSchema } from "./order.validation";

export const orderRoutes = Router();

orderRoutes.use(requireAuth);

orderRoutes.post(
  "/",
  validateRequest(createOrderSchema),
  asyncHandler(orderController.create.bind(orderController)),
);

orderRoutes.get(
  "/",
  validateRequest(listOrdersSchema),
  asyncHandler(orderController.findMine.bind(orderController)),
);

orderRoutes.get(
  "/:id",
  validateRequest(orderIdParamSchema),
  asyncHandler(orderController.findMineById.bind(orderController)),
);

orderRoutes.patch(
  "/:id/cancel",
  validateRequest(orderIdParamSchema),
  asyncHandler(orderController.cancelMine.bind(orderController)),
);
