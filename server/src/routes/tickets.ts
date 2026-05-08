import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/require-auth";
import { validate } from "../lib/validate";
import { sendClassifyTicketJob } from "../lib/queue";
import { createTicketSchema } from "core/schemas/tickets";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  const tickets = await prisma.ticket.findMany({
    where: { status: { notIn: ["new", "processing"] } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ tickets });
});

router.post("/", requireAuth, async (req, res) => {
  const data = validate(createTicketSchema, req.body, res);
  if (!data) return;

  const ticket = await prisma.ticket.create({
    data: {
      subject: data.subject,
      body: data.body,
      senderEmail: data.senderEmail,
      senderName: data.senderName,
    },
  });

  await sendClassifyTicketJob(ticket.id);

  res.status(201).json({ id: ticket.id });
});

export default router;
