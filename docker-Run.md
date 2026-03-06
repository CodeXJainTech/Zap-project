# ─────────────────────────────────────────────────────────────────────────────
# ZAP — Docker Compose (Development)
# things
# WHAT THIS FILE DOES:
#   Defines every service the project needs and wires them together so they
#   can talk to each other by name (e.g. "postgres", "kafka") instead of
#   IP addresses. It also controls startup order via healthchecks so, for
#   example, primary-backend never starts before Postgres is ready.
#
# HOW TO RUN (only Docker Desktop required — no Node/Postgres/Kafka needed):
#   First time or after code changes  →  docker compose up --build
#   Just start everything             →  docker compose up
#   Stop everything                   →  docker compose down
#   Logs for one service              →  docker compose logs -f primary-backend
#   Rebuild one service               →  docker compose up --build primary-backend
# ─────────────────────────────────────────────────────────────────────────────
