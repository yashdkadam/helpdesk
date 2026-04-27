import { z } from "zod/v4";
import type { Response } from "express";

export function validate<T>(
  schema: z.ZodType<T>,
  body: unknown,
  res: Response
): T | null {
  const result = schema.safeParse(body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return null;
  }
  return result.data;
}
