import { describe, test, expect, beforeEach, afterAll } from "bun:test";
import { prisma } from "../src/lib/prisma";
import { Role } from "core/constants/role.ts";

const email = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
const serverDir = import.meta.dir + "/..";

async function deleteUser() {
  await prisma.user.deleteMany({ where: { email } });
}

async function runSeed() {
  const proc = Bun.spawn(["bun", "run", "prisma/seed.ts"], {
    cwd: serverDir,
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { stdout, stderr, exitCode };
}

beforeEach(deleteUser);
afterAll(async () => {
  await deleteUser();
  await prisma.$disconnect();
});

describe("seed", () => {
  test("creates admin user on first run", async () => {
    const { exitCode } = await runSeed();
    expect(exitCode).toBe(0);

    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).not.toBeNull();
    expect(user!.role).toBe(Role.admin);
  }, 30000);

  test("throws when admin already exists", async () => {
    await runSeed();

    const { exitCode, stderr } = await runSeed();
    expect(exitCode).toBe(1);
    expect(stderr).toContain("Admin user should only be one");
  }, 30000);
});
