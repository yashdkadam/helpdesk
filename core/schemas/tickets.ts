import { z } from "zod/v4";
import { TicketStatus, TicketCategory } from "../constants/ticket.ts";

export const createTicketSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  senderEmail: z.string().email(),
  senderName: z.string().min(1),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const ticketAssigneeSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
});

export type TicketAssignee = z.infer<typeof ticketAssigneeSchema>;

export const ticketSchema = z.object({
  id: z.number(),
  subject: z.string(),
  body: z.string(),
  senderEmail: z.string(),
  senderName: z.string(),
  status: z.nativeEnum(TicketStatus),
  category: z.nativeEnum(TicketCategory).nullable(),
  assignedToId: z.string().nullable(),
  assignedTo: ticketAssigneeSchema.nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Ticket = z.infer<typeof ticketSchema>;

export const assignTicketSchema = z.object({
  assignedToId: z.string().nullable(),
});

export const updateTicketSchema = z.object({
  status: z.nativeEnum(TicketStatus).optional(),
  category: z.nativeEnum(TicketCategory).nullable().optional(),
});

export const SORTABLE_TICKET_FIELDS = [
  "subject",
  "senderName",
  "status",
  "category",
  "createdAt",
] as const;

export type SortableTicketField = (typeof SORTABLE_TICKET_FIELDS)[number];

export const ticketSortSchema = z.object({
  sortBy: z.enum(SORTABLE_TICKET_FIELDS).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export type TicketSortParams = z.infer<typeof ticketSortSchema>;

export const ticketFilterSchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(TicketStatus).optional(),
  category: z.nativeEnum(TicketCategory).optional(),
});

export type TicketFilterParams = z.infer<typeof ticketFilterSchema>;

export const ticketPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export type TicketPaginationParams = z.infer<typeof ticketPaginationSchema>;
