import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { requireAuth } from "./middleware/require-auth";

if (!process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET.startsWith("change-this")) {
  throw new Error("BETTER_AUTH_SECRET must be set to a random value");
}

const app = express();
const PORT = process.env.PORT ?? 3000;

app.disable("x-powered-by");
app.use(helmet());
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

async function boot() {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

boot();
