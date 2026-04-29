import { auth } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";
import { Role } from "core/constants/role.ts";

const email = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
const password = process.env.SEED_ADMIN_PASSWORD ?? "password123";

export async function seed() {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("Admin user should only be one");
  }

  const result = await auth.api.signUpEmail({
    body: { email, password, name: "Admin" },
  });

  await prisma.user.update({
    where: { id: result.user.id },
    data: { role: Role.admin },
  });

  console.log(`Admin user created: ${email}`);
}

if (import.meta.main) {
  seed()
    .catch((err: Error) => {
      console.error(err.message);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
