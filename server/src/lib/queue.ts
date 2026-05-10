import PgBoss from "pg-boss";
import { readFile } from "fs/promises";
import { join } from "path";
import { generateText } from "ai";
import { prisma } from "./prisma";
import { freeModel } from "./openrouter";
import { sendReplyEmail } from "./email";
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
  let knowledgeBase = "";
  try {
    knowledgeBase = await readFile(join(import.meta.dirname, "../../knowledge-base.md"), "utf-8");
  } catch (err) {
    console.warn("[queue] Could not read knowledge-base.md, continuing without it:", err);
  }

  const aiAgent = await prisma.user.findFirst({
    where: { email: "ai@helpdesk.internal" },
    select: { id: true },
  });
  const aiAgentId = aiAgent?.id ?? null;

  if (!aiAgentId) {
    console.warn("[queue] AI agent not found — tickets will not be auto-assigned");
  }

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

    if (aiAgentId) {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { assignedToId: aiAgentId },
      });
    }

    let resolved = false;
    try {
      const firstName = ticket.senderName.trim().split(" ")[0];
      const { text } = await generateText({
        model: freeModel,
        system: `You are a customer support agent named Yash for an online IT course platform. Try to resolve the support ticket automatically with a helpful, professional, and friendly reply.
${knowledgeBase ? `\nUse the following knowledge base as your primary reference:\n\n${knowledgeBase}\n` : ""}
Guidelines for your reply:
- Address the customer by their first name: ${firstName}
- Use a warm, professional, and customer-friendly tone
- Use proper formatting: greet the customer, explain the solution clearly with numbered steps or bullet points where appropriate, and close warmly
- Sign off as: Yash, Customer Support
- If you can fully resolve it, respond with valid JSON: {"resolved": true, "reply": "<your full reply>"}
- If the ticket requires human attention (e.g. refund requests, account-specific issues, or anything you cannot answer completely using the knowledge base), respond with valid JSON: {"resolved": false}
Respond with ONLY the JSON — no markdown fences, no preamble.`,
        prompt: `Subject: ${ticket.subject}\n\nMessage:\n${ticket.body}`,
      });

      const raw = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error(`No JSON object in response: ${raw.slice(0, 120)}`);
      const json = JSON.parse(match[0]);
      if (json.resolved === true && typeof json.reply === "string" && json.reply.trim()) {
        // Strip any greeting the model may have written, then prepend a consistent one
        const replyText = json.reply.trim().replace(/^(hi|hello|dear)\s+\S+[,.]?\s*/i, "");
        const body = `Hi ${firstName},\n\n${replyText}`;
        await prisma.ticketReply.create({
          data: {
            ticketId,
            senderType: "agent",
            body,
          },
        });
        sendReplyEmail({
          to: ticket.senderEmail,
          toName: ticket.senderName,
          subject: ticket.subject,
          body,
        }).catch((err) => console.error("[email] Failed to send auto-resolve email:", err));

        await prisma.ticket.update({
          where: { id: ticketId },
          data: { status: "auto_resolved" },
        });
        resolved = true;
      }
    } catch (err) {
      console.error("[auto-resolve-ticket] AI error:", err);
    }

    if (!resolved) {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: "open", assignedToId: null },
      });
    }

    console.log(`[auto-resolve-ticket] ticket ${ticketId} → ${resolved ? "auto_resolved" : "open"}`);
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
