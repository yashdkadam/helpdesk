import { Router } from "express";
import { prisma } from "../lib/prisma";
import { auth } from "../lib/auth";
import { requireAuth } from "../middleware/require-auth";
import { requireAdmin } from "../middleware/require-admin";
import { validate } from "../lib/validate";
import { createUserSchema } from "core/schemas/users";
import { Role } from "core/constants/role.ts";

const router = Router();

router.get("/", requireAuth, requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  res.json({ users });
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const data = validate(createUserSchema, req.body, res);
  if (!data) return;

  const result = await auth.api.signUpEmail({
    body: { name: data.name, email: data.email, password: data.password },
  });

  await prisma.user.update({
    where: { id: result.user.id },
    data: { role: Role.agent },
  });

  res.status(201).json({});
});

export default router;
