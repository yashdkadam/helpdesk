import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.user = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  };
  req.session = {
    id: session.session.id,
    token: session.session.token,
  };
  next();
}
