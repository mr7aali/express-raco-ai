import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { openApiDocument } from "./docs/openapi";
import { errorHandler } from "./middlewares/error-handler.middleware";
import { notFoundHandler } from "./middlewares/not-found.middleware";
import { authRoutes } from "./modules/auth/auth.routes";
import { categoryRoutes } from "./modules/categories/category.routes";
import { orderRoutes } from "./modules/orders/order.routes";
import { paymentRoutes } from "./modules/payments/payment.routes";
import { stripeWebhookRoutes } from "./modules/payments/stripe-webhook.routes";
import { productRoutes } from "./modules/products/product.routes";
import { userRoutes } from "./modules/users/user.routes";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(
  "/api/payments/webhooks/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhookRoutes,
);
app.use(express.json());
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

app.get("/api/docs.json", (_req, res) => {
  res.status(200).json(openApiDocument);
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
