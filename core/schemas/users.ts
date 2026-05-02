import { z } from "zod/v4";

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(), 
  password: z.string().min(8),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(["admin", "agent"]),
  createdAt: z.coerce.date(),
});

export type User = z.infer<typeof userSchema>;
