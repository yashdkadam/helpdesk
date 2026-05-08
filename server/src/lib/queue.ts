import PgBoss from "pg-boss";
import { prisma } from "./prisma";

const boss = new PgBoss(process.env.DATABASE_URL!);
boss.on("error", (err) => console.error("[pg-boss]", err));

const CLASSIFY_TICKET_QUEUE = "classify-ticket";

interface ClassifyTicketJobData {
  ticketId: number;
}

export async function startQueue(): Promise<void> {
  await boss.start();
  await boss.createQueue(CLASSIFY_TICKET_QUEUE);

  // Placeholder worker — transitions new → open so tickets are visible to agents.
  // Replace with real AI classification in a future task.
  await boss.work<ClassifyTicketJobData>(CLASSIFY_TICKET_QUEUE, async ([job]) => {
    await prisma.ticket.update({
      where: { id: job.data.ticketId },
      data: { status: "open" },
    });
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
