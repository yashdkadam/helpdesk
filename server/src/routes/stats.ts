import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/require-auth";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  const [totalTickets, openTickets, aiResolvedTickets, rawAvg, rawDaily] =
    await prisma.$transaction([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: "open" } }),
      prisma.ticket.count({ where: { status: "auto_resolved" } }),
      prisma.$queryRaw<[{ avg_ms: number | null }]>`
        SELECT AVG(
          EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) * 1000
        ) AS avg_ms
        FROM "ticket"
        WHERE status IN ('resolved', 'auto_resolved')
      `,
      prisma.$queryRaw<{ day: string; count: number }[]>`
        SELECT
          TO_CHAR(DATE("createdAt"), 'YYYY-MM-DD') AS day,
          COUNT(*)::int AS count
        FROM "ticket"
        WHERE "createdAt" >= CURRENT_DATE - INTERVAL '29 days'
        GROUP BY DATE("createdAt")
        ORDER BY day ASC
      `,
    ]);

  const aiResolvedPct =
    totalTickets > 0
      ? Math.round((aiResolvedTickets / totalTickets) * 1000) / 10
      : 0;

  const avgResolutionMs =
    rawAvg[0]?.avg_ms != null ? Number(rawAvg[0].avg_ms) : null;

  // Fill in zero-count days for a complete 30-day range
  const countMap = new Map(rawDaily.map((r) => [r.day, Number(r.count)]));
  const ticketsPerDay = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const day = d.toISOString().slice(0, 10);
    return { date: day, count: countMap.get(day) ?? 0 };
  });

  res.json({
    totalTickets,
    openTickets,
    aiResolvedTickets,
    aiResolvedPct,
    avgResolutionMs,
    ticketsPerDay,
  });
});

export default router;
