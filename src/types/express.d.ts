import type { UserRole } from "../generated/prisma/enums";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
      };
      validated?: {
        body?: unknown;
        params?: Request["params"];
        query?: Request["query"];
      };
    }
  }
}
