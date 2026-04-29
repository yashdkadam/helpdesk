import type { Role } from "core/constants/role.ts";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role?: Role;
      };
      session?: {
        id: string;
        token: string;
      };
    }
  }
}
