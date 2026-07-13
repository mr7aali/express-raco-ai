import axios from "axios";
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/client";
import { ApiError } from "../utils/api-error";

type ErrorResponse = {
  success: false;
  errorCode: string;
  message: string;
  errors?: unknown;
  path?: string;
  timestamp?: string;
};

type ErrorLike = Error & {
  code?: string;
  status?: number;
  statusCode?: number;
  type?: string;
  expose?: boolean;
};

function toErrorCode(message: string) {
  return message
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase()
    .slice(0, 80);
}

function sendError(req: Request, res: Response, statusCode: number, body: ErrorResponse) {
  res.status(statusCode).json({
    ...body,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
}

function getPrismaTarget(error: Prisma.PrismaClientKnownRequestError) {
  const target = error.meta?.target;

  if (Array.isArray(target)) {
    return target.join(", ");
  }

  return typeof target === "string" ? target : undefined;
}

function getProviderMessage(provider: string, fallback: string) {
  return `${provider} request failed. ${fallback}`;
}

function isStripeError(error: ErrorLike) {
  return typeof error.type === "string" && error.type.startsWith("Stripe");
}

export function errorHandler(error: Error, req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ApiError) {
    sendError(req, res, error.statusCode, {
      success: false,
      errorCode: error.errorCode ?? toErrorCode(error.message),
      message: error.message,
      errors: error.details,
    });
    return;
  }

  if (error instanceof ZodError) {
    sendError(req, res, 400, {
      success: false,
      errorCode: "VALIDATION_FAILED",
      message: "Validation failed",
      errors: error.flatten().fieldErrors,
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const target = getPrismaTarget(error);

    if (error.code === "P2002") {
      sendError(req, res, 409, {
        success: false,
        errorCode: "UNIQUE_CONSTRAINT_FAILED",
        message: target ? `${target} already exists` : "Resource already exists",
      });
      return;
    }

    if (error.code === "P2003") {
      sendError(req, res, 400, {
        success: false,
        errorCode: "INVALID_RELATION_REFERENCE",
        message: target ? `Invalid reference: ${target}` : "Invalid related resource reference",
      });
      return;
    }

    if (error.code === "P2025") {
      sendError(req, res, 404, {
        success: false,
        errorCode: "RESOURCE_NOT_FOUND",
        message: "Resource not found",
      });
      return;
    }

    if (error.code === "P2021" || error.code === "P2022") {
      console.error(error);
      sendError(req, res, 503, {
        success: false,
        errorCode: "DATABASE_SCHEMA_NOT_READY",
        message: "Database schema is not ready. Run migrations before using this endpoint.",
      });
      return;
    }

    console.error(error);
    sendError(req, res, 500, {
      success: false,
      errorCode: error.code ? `DATABASE_${error.code}` : "DATABASE_OPERATION_FAILED",
      message: "Database operation failed. Check backend logs for details.",
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    sendError(req, res, 400, {
      success: false,
      errorCode: "INVALID_DATABASE_QUERY_INPUT",
      message: "Invalid database query input",
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error(error);
    sendError(req, res, 503, {
      success: false,
      errorCode: "DATABASE_CONNECTION_UNAVAILABLE",
      message: "Database connection is not available",
    });
    return;
  }

  if (error instanceof SyntaxError && "body" in error) {
    sendError(req, res, 400, {
      success: false,
      errorCode: "MALFORMED_JSON",
      message: "Malformed JSON request body",
    });
    return;
  }

  if (axios.isAxiosError(error)) {
    const providerStatus = error.response?.status;
    const providerMessage =
      typeof error.response?.data === "object" &&
      error.response.data &&
      "message" in error.response.data
        ? String(error.response.data.message)
        : error.message;

    console.error(error);
    sendError(req, res, providerStatus && providerStatus >= 400 ? 502 : 503, {
      success: false,
      errorCode: "EXTERNAL_PROVIDER_ERROR",
      message: getProviderMessage("External provider", providerMessage),
    });
    return;
  }

  const errorLike = error as ErrorLike;

  if (isStripeError(errorLike)) {
    sendError(req, res, errorLike.statusCode ?? 502, {
      success: false,
      errorCode: errorLike.code ?? "STRIPE_ERROR",
      message: getProviderMessage("Stripe", error.message),
    });
    return;
  }

  if (typeof errorLike.status === "number" || typeof errorLike.statusCode === "number") {
    const statusCode = errorLike.status ?? errorLike.statusCode ?? 500;
    const isClientError = statusCode >= 400 && statusCode < 500;

    sendError(req, res, statusCode, {
      success: false,
      errorCode: errorLike.code ?? toErrorCode(error.message),
      message: isClientError || errorLike.expose ? error.message : "Request failed",
    });
    return;
  }

  console.error(error);

  sendError(req, res, 500, {
    success: false,
    errorCode: "INTERNAL_SERVER_ERROR",
    message: "Unexpected server error. Check backend logs for details.",
  });
}
