import { z } from "zod/v4";

export const createTicketSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  senderEmail: z.string().email(),
  senderName: z.string().min(1),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
