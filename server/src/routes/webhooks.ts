import { Router } from "express";
import multer from "multer";
import { prisma } from "../lib/prisma";
import { sendClassifyTicketJob } from "../lib/queue";
import { verifyWebhook } from "../middleware/verify-webhook";

const router = Router();
const parseMultipart = multer().none();

function parseFrom(from: string): { senderName: string; senderEmail: string } {
  const match = from.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) return { senderName: match[1].trim(), senderEmail: match[2].trim() };
  return { senderName: from.trim(), senderEmail: from.trim() };
}

router.post("/inbound-email", verifyWebhook, parseMultipart, async (req, res) => {
  const { from, subject, text, html } = req.body as Record<string, string | undefined>;

  if (!from || !subject) {
    res.status(400).json({ error: "Missing required fields: from, subject" });
    return;
  }

  const body = (text ?? html ?? "").trim();
  if (!body) {
    res.status(400).json({ error: "Missing body (text or html)" });
    return;
  }

  const { senderName, senderEmail } = parseFrom(from);

  const ticket = await prisma.ticket.create({
    data: { subject: subject.trim(), body, senderEmail, senderName },
  });

  await sendClassifyTicketJob(ticket.id);

  res.status(202).json({ id: ticket.id });
});

export default router;
