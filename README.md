# Zap

A Zapier-like automation platform where users can create workflows with triggers and actions. When a trigger fires (e.g. a webhook), it runs a chain of actions (e.g. send an email) automatically.

Currently supports email sending. The architecture is built to plug in more actions easily.

---

## How it works

1. User creates a **Zap** — a webhook trigger + one or more actions (e.g. send email)
2. A webhook hits the **hooks** service, which stores the event in the database
3. The **processor** picks it up from the outbox and pushes it to Kafka (`zap-events` topic)
4. The **worker** consumes from Kafka and executes the actions in order (email, etc.)

---

## Services

| Service | Port | Role |
|---------|------|------|
| `primary-backend` | 3000 | REST API — users, zaps, triggers, actions |
| `hooks` | 3002 | Receives incoming webhooks and queues them |
| `processor` | — | Outbox processor, pushes events to Kafka |
| `worker` | — | Kafka consumer, executes actions |
| `frontend` | 3001 | Next.js UI |

---

## Stack

- **Backend** — Node.js, Express, TypeScript
- **Database** — PostgreSQL + Prisma ORM
- **Queue** — Kafka (via KafkaJS)
- **Frontend** — Next.js, Tailwind CSS

---

## Running locally

Only requires Docker Desktop.

```bash
# First time or after code changes
docker compose up --build

# Just start
docker compose up

# Stop
docker compose down

# Logs for a service
docker compose logs -f service_name
```

API available at `http://localhost:3000`  
Frontend at `http://localhost:3001`

---

## Adding a new action

1. Seed a new `AvailableAction` in `primary-backend/src/seed.ts`
2. Handle the new `action.type.id` in `worker/src/index.ts`