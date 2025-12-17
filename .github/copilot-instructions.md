<!-- Short, actionable instructions for AI coding agents working on this repo -->
# Copilot instructions — AssisantAI

Purpose: Help an AI coding agent be productive immediately in the AssisantAI monorepo by summarizing the architecture, common developer workflows, project-specific conventions, and concrete commands/examples.

1) Big picture (read these files first)
- `README.md` — master overview and Quick Start (install/start/ports)
- `hub/README.md` — Central dashboard (Next.js) and how it queries middleware
- `middleware/README.md` — API gateway, auth, and agent routing endpoints
- `package.json` (root) — npm workspace scripts and `start:all`/`install:all`

2) Architecture summary (concise)
- Monorepo using npm workspaces. Top-level folders: `apps/`, `packages/`, `hub/`, `middleware/`.
- `middleware` is the API gateway and authority for app registrations and agent routing (port 4199).
- `hub` is the Next.js dashboard that talks to the middleware via `NEXT_PUBLIC_MIDDLEWARE_URL` (default http://localhost:4199) and polls app status.
- Individual apps live under `apps/*` and are registered in `config/apps.json` and `config/ports.json`.

3) How to run & common commands (copyable)
- Install everything (recommended):
```
./install.sh
```
- Start all services (or use `npm` script):
```
./start.sh
# or
npm run start:all
```
- Stop all services:
```
./stop.sh
```
- Per-service development:
```
# Hub (dev)
npm run dev:hub
# Middleware (dev)
npm run dev:middleware
# Start middleware standalone
npm run start:middleware
```

4) Ports & access (important hard-coded defaults)
- Middleware: `http://localhost:4199`
- Central Hub: `http://localhost:4200`
- MVP Backend: `http://localhost:4201`
- PersonalAI Backend: `http://localhost:4202`
- PersonalAI Frontend: `http://localhost:4203`
- MVP Frontend: `http://localhost:4204`

5) Where to look when something is broken
- Logs: top-level `logs/` (e.g. `logs/hub.log`, `logs/middleware.log`). Tail them:
```
tail -f logs/middleware.log
tail -f logs/hub.log
```
- Confirm processes and ports:
```
lsof -iTCP -sTCP:LISTEN -n -P | grep 4199
curl -v http://localhost:4199/health
curl -v http://localhost:4199/api/hub/apps
```
- If Simple Browser / VS Code WebView shows extension or SubtleCrypto errors, use an external browser (`open "http://localhost:4200"`)—those errors are usually WebView/extension noise.

6) Project-specific patterns & conventions
- App registration: `npm run register-app -- <app-id> <app-name> <type> [desc]` updates the central registry so the hub can show the app.
- Port management: `config/ports.json` and `config/apps.json` drive automatic port assignment; `start.sh` orchestrates these values.
- Shared code: `packages/*` contain reusable TypeScript modules (auth, agent, port-manager). Changes here affect multiple apps.
- Local dev UX: `start.sh`/`stop.sh` are the canonical orchestration scripts — prefer them over manually starting every workspace unless doing focused development.

7) Integration & external dependencies
- The repo expects some system-wide tools (see `install.sh`): Homebrew, Node >=18, npm >=9, Python for some scripts, and optionally Ollama (models). `install.sh` attempts to install or verify them.
- Middleware exposes REST endpoints used by the hub and apps (see `middleware/README.md`). Hub reads `NEXT_PUBLIC_MIDDLEWARE_URL` from `hub/.env.local`.

8) Small, concrete examples for common tasks
- Add a new app skeleton: create `apps/<id>/` with `package.json`, add an entry to `config/apps.json`, then run `./install.sh` and `./start.sh`.
- Debugging connectivity failure between hub and middleware:
  1. `curl http://localhost:4199/api/hub/apps` (if this returns data, hub can reach middleware)
  2. `tail -n 200 logs/hub.log` and `tail -n 200 logs/middleware.log`
  3. Ensure ad-blockers or VS Code WebView aren't blocking `localhost:*`

9) What not to change without asking a human
- Don't change port defaults in `config/ports.json` or the orchestration around `start.sh` unless you update `start.sh`, `stop.sh`, and `hub/.env.local` accordingly.
- Avoid renaming workspace entries in root `package.json` without updating scripts that call `--workspace`.

10) Links / files to inspect next (quick pointers)
- `start.sh`, `stop.sh`, `install.sh`
- `config/apps.json`, `config/ports.json`
- `hub/` (Next.js app) — `hub/.env.local`, `hub/pages` or `app` directory
- `middleware/` — `src` and `.env.example`

If anything above is unclear or you want a different level of detail (e.g., more API examples, main TypeScript entry points, or a checklist for adding a new app), tell me which area to expand and I'll update this file.
