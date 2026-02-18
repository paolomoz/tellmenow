# TellMeNow

Monorepo with a Cloudflare Workers backend (`worker/`) and a React + Vite frontend (`frontend/`).

## Local Dev Setup

Port 8787 may be in use by other projects. Use port 8788 for the worker.

### 1. Run DB migrations (first time or after schema changes)

```bash
cd worker && npm run db:migrate:local
```

### 2. Start the worker

```bash
cd worker && npm run dev -- --port 8788
```

### 3. Start the frontend

```bash
cd frontend && npm run dev
```

The Vite dev server proxies `/api` requests to `http://localhost:8788` (configured in `frontend/vite.config.ts`).

### 4. Open the app

Visit the frontend URL printed by Vite (typically http://localhost:5173 or next available port).

## Project Structure

- `worker/src/` — Hono API, LLM client (`llm/client.ts`), pipeline engine (`engine/pipeline.ts`), skills
- `worker/migrations/` — D1 SQL migrations
- `worker/.dev.vars` — Local secrets (not committed)
- `frontend/src/` — React app with Tailwind CSS

## Useful Commands

- `cd worker && npx wrangler d1 execute tellmenow-db --local --command "SQL"` — Run SQL against local D1
- `cd worker && npm run deploy` — Deploy worker to Cloudflare
- `cd worker && npm run db:migrate:remote` — Apply migrations to remote D1
- `cd frontend && npm run build` — Build frontend for production
