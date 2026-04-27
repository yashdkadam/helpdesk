import { z } from "zod/v4";

export const createTicketSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  fromEmail: z.string().email(),
  fromName: z.string().min(1),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
