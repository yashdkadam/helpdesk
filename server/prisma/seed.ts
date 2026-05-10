import { auth } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";
import { Role } from "core/constants/role.ts";

const email = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
const password = process.env.SEED_ADMIN_PASSWORD ?? "password123";

export async function seed() {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user already exists, skipping: ${email}`);
  } else {
    const result = await auth.api.signUpEmail({
      body: { email, password, name: "Admin" },
    });

    await prisma.user.update({
      where: { id: result.user.id },
      data: { role: Role.admin },
    });

    console.log(`Admin user created: ${email}`);
  }

  const aiEmail = "ai@helpdesk.internal";
  const existingAi = await prisma.user.findUnique({ where: { email: aiEmail } });
  if (existingAi) {
    console.log(`AI agent already exists, skipping: ${aiEmail}`);
  } else {
    const now = new Date();
    await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        name: "AI",
        email: aiEmail,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
    });

    console.log(`AI agent created: ${aiEmail}`);
  }
}

if (import.meta.main) {
  seed()
    .catch((err: Error) => {
      console.error(err.message);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
