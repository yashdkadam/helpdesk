import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { join } from "path";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { requireAuth } from "./middleware/require-auth";
import { startQueue, stopQueue } from "./lib/queue";
import usersRouter from "./routes/users";
import ticketsRouter from "./routes/tickets";
import webhooksRouter from "./routes/webhooks";
import statsRouter from "./routes/stats";

if (!process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET.startsWith("change-this")) {
  throw new Error("BETTER_AUTH_SECRET must be set to a random value");
}

const app = express();
const PORT = process.env.PORT ?? 3000;

app.disable("x-powered-by");
app.use(helmet({
  hsts: false,
  contentSecurityPolicy: false,
  crossOriginOpenerPolicy: false,
}));
app.use(
  cors({
    origin: process.env.CLIENT_URL ?? "http://localhost:5173",
    credentials: true,
  })
);

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== "production",
});

app.post("/api/auth/sign-up/email", (_req, res) => {
  res.status(403).json({ message: "Email and password sign up is not enabled", code: "EMAIL_AND_PASSWORD_SIGN_UP_IS_NOT_ENABLED" });
});

// Better Auth must be mounted before express.json()
app.all("/api/auth/*splat", authRateLimit, toNodeHandler(auth));

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.use("/api/users", usersRouter);
app.use("/api/tickets", ticketsRouter);
app.use("/api/webhooks", webhooksRouter);
app.use("/api/stats", statsRouter);

if (process.env.NODE_ENV === "production") {
  const clientDist = join(import.meta.dirname, "../../client/dist");
  app.use(express.static(clientDist));
  app.get(/^(?!\/api)/, (_req, res) => {
    res.sendFile(join(clientDist, "index.html"));
  });
}

async function boot() {
  await startQueue();

  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  async function shutdown(signal: string) {
    console.log(`[${signal}] shutting down...`);
    server.close();
    await stopQueue();
    process.exit(0);
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

boot();
