import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

type ParsedRequest = {
  body?: unknown;
  params?: Request["params"];
  query?: Request["query"];
};

export function validateRequest(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
    }) as ParsedRequest;

    req.body = parsed.body ?? req.body;
    req.params = parsed.params ?? req.params;
    req.query = parsed.query ?? req.query;

    next();
  };
}
