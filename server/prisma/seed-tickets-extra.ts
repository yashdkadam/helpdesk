import { prisma } from "../src/lib/prisma";

const tickets = [
  { subject: "How do I revoke API key access?", body: "A developer left the company and I need to immediately revoke their API keys.", senderName: "Nora Thompson", senderEmail: "nora.t@security.ops", status: "open", category: "general_question", daysAgo: 1 },
  { subject: "Bulk user import via CSV failing", body: "I'm trying to import 200 users via CSV but the import always fails on row 47 with no error message.", senderName: "Eli Walker", senderEmail: "eli.w@hr.company", status: "open", category: "technical_question", daysAgo: 2 },
  { subject: "Refund for seat charged during free trial", body: "During my free trial a seat charge appeared. I didn't add any paid users intentionally.", senderName: "Cora Hall", senderEmail: "cora.h@trial.billing", status: "open", category: "refund_request", daysAgo: 3 },
  { subject: "Single sign-on keeps redirecting to login loop", body: "After SSO authentication succeeds, the app redirects back to the login page in an infinite loop.", senderName: "Miles Young", senderEmail: "miles.y@sso.issue", status: "resolved", category: "technical_question", daysAgo: 11 },
  { subject: "Requesting W-9 tax form", body: "Our accounting team needs your W-9 form for vendor payment processing.", senderName: "Vera Hernandez", senderEmail: "vera.h@accounting.corp", status: "resolved", category: "general_question", daysAgo: 24 },
  { subject: "Wrong VAT rate applied to invoice", body: "Our country has a 20% VAT rate but invoices are showing 23%. Please correct and reissue.", senderName: "Rex King", senderEmail: "rex.k@vat.eu", status: "open", category: "refund_request", daysAgo: 5 },
  { subject: "Dashboard shows stale data after refresh", body: "Even after a hard refresh, the dashboard shows data from 6 hours ago rather than live data.", senderName: "Ada Wright", senderEmail: "ada.w@realtime.needed", status: "open", category: "technical_question", daysAgo: 4 },
  { subject: "Need invoice with different company name", body: "We recently rebranded and need a corrected invoice issued under our new company name.", senderName: "Otto Scott", senderEmail: "otto.s@rebrand.biz", status: "resolved", category: "general_question", daysAgo: 20 },
  { subject: "Refund after switching to competitor", body: "We've migrated to another platform and have 8 months remaining on our annual contract.", senderName: "Iris Torres", senderEmail: "iris.t@churned.customer", status: "closed", category: "refund_request", daysAgo: 62 },
  { subject: "Notifications firing multiple times per event", body: "Each event triggers 3–4 duplicate email notifications instead of one.", senderName: "Silas Moore", senderEmail: "silas.m@duplicate.notify", status: "open", category: "technical_question", daysAgo: 7 },
];

async function main() {
  const created = await prisma.$transaction(
    tickets.map((t) => {
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - t.daysAgo);
      return prisma.ticket.create({
        data: {
          subject: t.subject,
          body: t.body,
          senderName: t.senderName,
          senderEmail: t.senderEmail,
          status: t.status as "open" | "resolved" | "closed",
          category: t.category as "general_question" | "technical_question" | "refund_request",
          createdAt,
        },
      });
    })
  );
  console.log(`Created ${created.length} additional tickets. Total: 100.`);
  await prisma.$disconnect();
}

main();
