import type { Request } from "express";
import { ApiError } from "./api-error";

export function getStringParam(req: Request, paramName: string) {
  const value = req.params[paramName];

  if (typeof value !== "string") {
    throw new ApiError(400, `Invalid ${paramName} parameter`);
  }

  return value;
}
