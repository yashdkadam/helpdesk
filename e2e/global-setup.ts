import { execSync } from "child_process";
import { fileURLToPath } from "url";
import path from "path";
import { TEST_DATABASE_URL, TEST_AUTH_SECRET, SERVER_URL } from "./test-env";

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../server");

const env = {
  ...process.env,
  DATABASE_URL: TEST_DATABASE_URL,
  BETTER_AUTH_SECRET: TEST_AUTH_SECRET,
  BETTER_AUTH_URL: SERVER_URL,
};

export default async function globalSetup() {
  execSync("bunx prisma migrate deploy", {
    cwd: serverDir,
    env,
    stdio: "inherit",
  });

  execSync("bun run prisma/seed.e2e.ts", {
    cwd: serverDir,
    env,
    stdio: "inherit",
  });
}
