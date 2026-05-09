import { Router } from "express";
import { prisma, Prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/require-auth";
import { validate } from "../lib/validate";
import { parseId } from "../lib/parse-id";
import { sendClassifyTicketJob } from "../lib/queue";
import { createTicketSchema, ticketSortSchema, ticketFilterSchema, ticketPaginationSchema, assignTicketSchema, updateTicketSchema } from "core/schemas/tickets";

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
    status: status ?? { notIn: ["new", "processing"] as const },
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
