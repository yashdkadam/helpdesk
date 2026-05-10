import { Router } from "express";
import { prisma, Prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/require-auth";
import { validate } from "../lib/validate";
import { parseId } from "../lib/parse-id";
import { sendClassifyTicketJob } from "../lib/queue";
import { createTicketSchema, ticketSortSchema, ticketFilterSchema, ticketPaginationSchema, assignTicketSchema, updateTicketSchema, createTicketReplySchema } from "core/schemas/tickets";
import { generateText } from "ai";
import { freeModel } from "../lib/openrouter";

const ASSIGNEE_SELECT = { id: true, name: true, email: true } as const;

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const { sortBy, sortOrder } = ticketSortSchema.safeParse(req.query).data ?? {};
  const { search, status, category } = ticketFilterSchema.safeParse(req.query).data ?? {};
  const { page, pageSize } = ticketPaginationSchema.parse(req.query);

  const field = sortBy ?? "createdAt";
  const order = sortOrder ?? "desc";

  const orderBy =
    field === "category"
      ? { category: { sort: order, nulls: "last" as const } }
      : { [field]: order };

  const where: Prisma.TicketWhereInput = {
    status: status ?? { notIn: ["new", "processing", "auto_resolved"] as const },
    ...(category && { category }),
    ...(search && { subject: { contains: search, mode: Prisma.QueryMode.insensitive } }),
  };

  const [tickets, total] = await prisma.$transaction([
    prisma.ticket.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { assignedTo: { select: ASSIGNEE_SELECT } },
    }),
    prisma.ticket.count({ where }),
  ]);

  res.json({ tickets, total, page, pageSize });
});

router.get("/:id", requireAuth, async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { assignedTo: { select: ASSIGNEE_SELECT } },
  });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  res.json(ticket);
});

router.patch("/:id", requireAuth, async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const data = validate(updateTicketSchema, req.body, res);
  if (!data) return;

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const updated = await prisma.ticket.update({
    where: { id },
    data,
    include: { assignedTo: { select: ASSIGNEE_SELECT } },
  });

  res.json(updated);
});

router.patch("/:id/assign", requireAuth, async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const data = validate(assignTicketSchema, req.body, res);
  if (!data) return;

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  if (data.assignedToId !== null) {
    const user = await prisma.user.findUnique({ where: { id: data.assignedToId, deletedAt: null } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
  }

  const updated = await prisma.ticket.update({
    where: { id },
    data: { assignedToId: data.assignedToId },
    include: { assignedTo: { select: ASSIGNEE_SELECT } },
  });

  res.json(updated);
});

const REPLY_AUTHOR_SELECT = { id: true, name: true, email: true } as const;

router.get("/:id/replies", requireAuth, async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const replies = await prisma.ticketReply.findMany({
    where: { ticketId: id },
    orderBy: { createdAt: "asc" },
    include: { author: { select: REPLY_AUTHOR_SELECT } },
  });

  res.json({ replies });
});

router.post("/:id/replies", requireAuth, async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const data = validate(createTicketReplySchema, req.body, res);
  if (!data) return;

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const reply = await prisma.ticketReply.create({
    data: {
      ticketId: id,
      senderType: "agent",
      authorId: req.user!.id,
      body: data.body,
    },
    include: { author: { select: REPLY_AUTHOR_SELECT } },
  });

  res.status(201).json(reply);
});

router.post("/:id/summarize", requireAuth, async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const replies = await prisma.ticketReply.findMany({
    where: { ticketId: id },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { name: true } } },
  });

  const conversation = replies
    .map((r) => {
      const sender = r.senderType === "agent" ? (r.author?.name ?? "Agent") : ticket.senderName;
      return `${sender}: ${r.body}`;
    })
    .join("\n\n");

  const prompt = `Ticket subject: ${ticket.subject}\n\nCustomer message:\n${ticket.body}${conversation ? `\n\nConversation:\n${conversation}` : ""}`;

  const { text } = await generateText({
    model: freeModel,
    system:
      "You are a customer support assistant. Summarize the support ticket and conversation history concisely. Include the customer's main issue, any solutions or responses provided, and the current status. Return only the summary — no preamble, no explanation.",
    prompt,
  });

  res.json({ summary: text });
});

router.post("/:id/polish-reply", requireAuth, async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const data = validate(createTicketReplySchema, req.body, res);
  if (!data) return;

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const { text } = await generateText({
    model: freeModel,
    system:
      "You are a professional customer support agent. Improve the draft reply to be clear, professional, empathetic, and concise. Return only the improved reply text — no preamble, no explanation.",
    prompt: `Ticket subject: ${ticket.subject}\n\nCustomer message:\n${ticket.body}\n\nDraft reply:\n${data.body}`,
  });

  res.json({ polished: text });
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
