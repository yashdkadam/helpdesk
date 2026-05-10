# Helpdesk

An AI-powered ticket management system that automatically classifies, responds to, and routes customer support requests — so your team only handles what actually needs a human.

![Dashboard](public/dashboard.PNG)

---

## The Problem

Support teams waste hours triaging repetitive tickets — password resets, billing questions, how-to requests — that could be answered instantly. At the same time, tickets that genuinely need human attention get buried in the noise.

Helpdesk solves this by putting AI in the loop: every inbound ticket is automatically classified and handed to an LLM that attempts a resolution. If the AI can answer it confidently, the customer gets a reply within seconds. If not, the ticket surfaces to a human agent in the right category, already prioritized.

---

## Screenshots

| Login | Tickets |
|---|---|
| ![Login](public/login.PNG) | ![Tickets](public/tickets.PNG) |

![Users](public/users.png)

![Results](public/result.png)

---

## Features

- **Inbound email → ticket** via SendGrid webhook — emails become tickets automatically
- **AI classification** — tickets are tagged as General Question, Technical Question, or Refund Request
- **AI auto-resolution** — LLM attempts to resolve tickets using a knowledge base; sends a personalized reply if confident
- **Human escalation** — unresolved tickets surface to agents with status `open`
- **Agent reply tools** — agents can reply, reassign, close, or ask AI to polish a draft
- **Role-based access** — Admin and Agent roles; admins manage users, agents handle tickets
- **Dashboard metrics** — total tickets, open count, AI resolution rate, avg resolution time, daily chart

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, shadcn/ui, Tailwind CSS v4 |
| Backend | Express 5, TypeScript, Bun |
| Database | PostgreSQL, Prisma ORM |
| Auth | Better Auth (email/password, database sessions) |
| AI | OpenRouter API via Vercel AI SDK |
| Job Queue | pg-boss (PostgreSQL-backed) |
| Email | SendGrid (inbound webhook + outbound API) |
| Deployment | Railway (single service — Express serves the built React app) |

---

## Local Setup

### Prerequisites

- [Bun](https://bun.sh) v1.2+
- PostgreSQL database
- OpenRouter API key (free tier works)
- SendGrid account (optional — email features are skipped gracefully without it)

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
```

Fill in `server/.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/helpdesk
BETTER_AUTH_SECRET=<random 32+ char string>
BETTER_AUTH_URL=http://localhost:3000
CLIENT_URL=http://localhost:5173
OPENROUTER_API_KEY=<your key>
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=<strong password>
```

Generate a secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Set up the database

```bash
cd server
bunx prisma migrate deploy
bun run db:seed
```

### 4. Start the app

```bash
# Terminal 1 — backend (port 3000)
cd server && bun run dev

# Terminal 2 — frontend (port 5173)
cd client && bun run dev
```

Open [http://localhost:5173](http://localhost:5173) and sign in with the credentials from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.

---

## How the AI Pipeline Works

```
Inbound email
     │
     ▼
POST /api/webhooks/inbound-email
     │
     ▼
Ticket created (status: new)
     │
     ├──► [classify-ticket job]  →  tags ticket with a category
     │
     └──► [auto-resolve-ticket job]
               │
               ├── AI resolves → reply sent to customer, status: auto_resolved
               │
               └── AI unsure  → ticket goes to status: open for human agent
```

Jobs run in the background via pg-boss with retry and exponential backoff. HTTP responses are instant — AI processing happens asynchronously.
