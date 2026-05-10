import PgBoss from "pg-boss";
import { generateText } from "ai";
import { prisma } from "./prisma";
import { freeModel } from "./openrouter";
import type { TicketCategory } from "core/constants/ticket.ts";

const boss = new PgBoss(process.env.DATABASE_URL!);
boss.on("error", (err) => console.error("[pg-boss]", err));

const CLASSIFY_TICKET_QUEUE = "classify-ticket";
const AUTO_RESOLVE_TICKET_QUEUE = "auto-resolve-ticket";

const VALID_CATEGORIES: TicketCategory[] = [
  "general_question",
  "technical_question",
  "refund_request",
];

interface ClassifyTicketJobData {
  ticketId: number;
}

interface AutoResolveTicketJobData {
  ticketId: number;
}

export async function startQueue(): Promise<void> {
  await boss.start();
  await boss.createQueue(CLASSIFY_TICKET_QUEUE);
  await boss.createQueue(AUTO_RESOLVE_TICKET_QUEUE);

  await boss.work<ClassifyTicketJobData>(CLASSIFY_TICKET_QUEUE, async ([job]) => {
    const { ticketId } = job.data;

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return;

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: "processing" },
    });

    let category: TicketCategory | null = null;
    try {
      const { text } = await generateText({
        model: freeModel,
        system: `You are a customer support classifier. Classify the support ticket into exactly one of these categories:
- general_question: general inquiries, account questions, how-to questions
- technical_question: bug reports, technical errors, integration problems
- refund_request: refund requests, billing disputes, cancellations

Reply with ONLY the category name — nothing else.`,
        prompt: `Subject: ${ticket.subject}\n\nMessage:\n${ticket.body}`,
      });

      const parsed = text.trim().toLowerCase() as TicketCategory;
      if (VALID_CATEGORIES.includes(parsed)) {
        category = parsed;
      } else {
        console.warn(`[classify-ticket] Unexpected category value: "${text.trim()}"`);
      }
    } catch (err) {
      console.error("[classify-ticket] AI error:", err);
    }

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { ...(category && { category }) },
    });

    console.log(`[classify-ticket] ticket ${ticketId} → category: ${category ?? "none"}`);

    await boss.send(
      AUTO_RESOLVE_TICKET_QUEUE,
      { ticketId },
      { retryLimit: 3, retryDelay: 30, retryBackoff: true }
    );
  });

  await boss.work<AutoResolveTicketJobData>(AUTO_RESOLVE_TICKET_QUEUE, async ([job]) => {
    const { ticketId } = job.data;

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return;

    let resolved = false;
    try {
      const { text } = await generateText({
        model: freeModel,
        system: `You are a customer support agent. Try to resolve the support ticket automatically with a helpful reply.
If you can fully resolve it, respond with valid JSON: {"resolved": true, "reply": "<your full reply>"}
If the ticket requires human attention (e.g. refund requests, account-specific issues, or anything you cannot answer completely), respond with valid JSON: {"resolved": false}
Respond with ONLY the JSON — no markdown, no preamble.`,
        prompt: `Subject: ${ticket.subject}\n\nMessage:\n${ticket.body}`,
      });

      const json = JSON.parse(text.trim());
      if (json.resolved === true && typeof json.reply === "string" && json.reply.trim()) {
        await prisma.ticketReply.create({
          data: {
            ticketId,
            senderType: "agent",
            body: json.reply.trim(),
          },
        });
        await prisma.ticket.update({
          where: { id: ticketId },
          data: { status: "resolved" },
        });
        resolved = true;
      }
    } catch (err) {
      console.error("[auto-resolve-ticket] AI error:", err);
    }

    if (!resolved) {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: "open" },
      });
    }

    console.log(`[auto-resolve-ticket] ticket ${ticketId} → ${resolved ? "resolved" : "open"}`);
  });

  console.log("[queue] pg-boss started");
}

export async function stopQueue(): Promise<void> {
  await boss.stop();
}

export async function sendClassifyTicketJob(ticketId: number): Promise<void> {
  await boss.send(
    CLASSIFY_TICKET_QUEUE,
    { ticketId },
    { retryLimit: 3, retryDelay: 30, retryBackoff: true }
  );
}
