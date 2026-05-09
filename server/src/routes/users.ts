import { Router } from "express";
import { prisma } from "../lib/prisma";
import { auth } from "../lib/auth";
import { requireAuth } from "../middleware/require-auth";
import { requireAdmin } from "../middleware/require-admin";
import { validate } from "../lib/validate";
import { createUserSchema, updateUserSchema } from "core/schemas/users";
import { Role } from "core/constants/role.ts";
import { hashPassword } from "better-auth/crypto";

const router = Router();

router.get("/", requireAuth, requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  res.json({ users });
});

router.get("/agents", requireAuth, async (_req, res) => {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
  res.json({ users });
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const data = validate(createUserSchema, req.body, res);
  if (!data) return;

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const result = await auth.api.signUpEmail({
    body: { name: data.name, email: data.email, password: data.password },
  });

  await prisma.user.update({
    where: { id: result.user.id },
    data: { role: Role.agent },
  });

  res.status(201).json({});
});

router.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = req.params.id as string;

  const data = validate(updateUserSchema, req.body, res);
  if (!data) return;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (data.email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      res.status(409).json({ error: "Email already in use" });
      return;
    }
  }

  await prisma.user.update({
    where: { id },
    data: { name: data.name, email: data.email },
  });

  if (data.password) {
    const hashed = await hashPassword(data.password);
    await prisma.account.updateMany({
      where: { userId: id, providerId: "credential" },
      data: { password: hashed },
    });
  }

  res.json({});
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = req.params.id as string;

  const user = await prisma.user.findUnique({ where: { id, deletedAt: null } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (user.role === Role.admin) {
    res.status(403).json({ error: "Admin users cannot be deleted" });
    return;
  }

  await prisma.$transaction([
    prisma.ticket.updateMany({
      where: { assignedToId: id },
      data: { assignedToId: null },
    }),
    prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    }),
  ]);

  res.json({});
});

export default router;
