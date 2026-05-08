import { auth } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";
import { Role } from "core/constants/role.ts";

// Truncate all tables for a clean state before each test run
await prisma.ticket.deleteMany({});
await prisma.verification.deleteMany({});
await prisma.session.deleteMany({});
await prisma.account.deleteMany({});
await prisma.user.deleteMany({});

const admin = await auth.api.signUpEmail({
  body: { email: "admin@example.com", password: "password123", name: "Admin" },
});
await prisma.user.update({
  where: { id: admin.user.id },
  data: { role: Role.admin },
});

await auth.api.signUpEmail({
  body: { email: "agent@example.com", password: "password123", name: "Agent" },
});

console.log("E2E seed complete: admin@example.com, agent@example.com");
await prisma.$disconnect();
