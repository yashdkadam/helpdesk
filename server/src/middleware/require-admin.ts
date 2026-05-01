import type { Request, Response, NextFunction } from "express";
import { Role } from "core/constants/role.ts";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== Role.admin) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}
