# GitHub Copilot — Usage Guide for AssisantAI

This short guide helps developers and AI coding agents (Copilot) be more effective in this repository.

Prerequisites

- Sign in to GitHub and enable GitHub Copilot / Copilot Chat for your account or organization.
- Install the recommended VS Code extensions (workspace prompt will show them from `.vscode/extensions.json`).

Workspace settings provided

- `.vscode/settings.json` enables Copilot inline suggestions and `editor.inlineSuggest` for immediate completions.

Where Copilot helps most in this repo

- `hub/` (Next.js): UI, React components, API client calls to middleware (`/api/hub/apps`).
- `middleware/` (Express/TS): API routes, auth middleware, agent routing logic.
- `packages/` (shared TS): auth, agent, port-manager utilities used across apps.
- `apps/*`: app-specific backends/frontends; Copilot can scaffold new apps or fix local issues.

Practical prompts and examples

- Add a new app skeleton:

```
"Create a minimal Node + Express app in `apps/new-app` with a package.json, a server that listens on the port from config/ports.json, and a README.md. Use TypeScript and include npm scripts: dev, build, start."
```

- Implement API endpoint in middleware:

```
"Add a new route `GET /api/hub/apps` in `middleware/src/routes/hub.ts` that reads `config/apps.json` and returns the apps array as JSON with proper error handling and unit tests."
```

- Fix CORS issue when hub can't reach middleware:

```
"Inspect `middleware/src/index.ts` for CORS configuration, ensure `ALLOWED_ORIGINS` from `.env` is used and add `http://localhost:4200` during development. Provide a small patch."
```

- Create a unit test

```
"Write a Jest test for `packages/port-manager/src/index.ts` that verifies `assignPort` returns an unused port given `config/ports.json`."
```

Copilot Chat tips

- Provide file paths and relevant files when asking Copilot Chat (open the file first in the editor so the extension has context).
- Use stepwise requests: e.g., "(1) Create route; (2) Add tests; (3) Update hub to call route."

Security & secrets

- Never ask Copilot to generate or persist secrets into code. Keep API keys and tokens in `.env` files (these are gitignored).

Developer workflow examples

- Start everything locally (recommended): `./install.sh` then `./start.sh`.
- Work on hub only: `npm run dev:hub` then open `http://localhost:4200` in an external browser for best debugging (VS Code Simple Browser may block extensions/assets).

If you want, I can:

- Add more targeted prompt templates for common tasks (tests, endpoints, UI components).
- Create a `COPILOT_PROMPTS.md` with ready-to-copy prompts tailored to the repo.
