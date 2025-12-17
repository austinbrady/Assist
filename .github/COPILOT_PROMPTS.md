# Copilot Prompts — Ready-to-copy prompts for AssisantAI

Use these prompts with GitHub Copilot / Copilot Chat. Include file paths (open files in the editor) for best context.

-- Hub (Next.js / frontend)

- Scaffold an app card component:

```
Create a React component `hub/src/components/AppCard.tsx` that shows an app's name, port, status (running/stopped), and start/stop buttons. Use existing Hub styles, accept a prop `app: { id, name, port, type, enabled }` and emit `onStart(appId)` and `onStop(appId)` callbacks. Add unit tests with React Testing Library.
```

- Fix API call & handle blocked requests:

```
Inspect `hub/src/utils/api.ts` (or wherever Axios is used) and add retry logic and clearer error messages when requests to `NEXT_PUBLIC_MIDDLEWARE_URL/api/hub/apps` fail due to CORS or ad-blockers. Provide user-friendly messaging in UI and ensure `console.error` includes the request URL and status.
```

-- Middleware (Express / TypeScript)

- Add `GET /api/hub/apps` route:

```
Add a route in `middleware/src/routes/hub.ts` that reads `config/apps.json` and returns `{ apps }`. Use try/catch, log errors to `logs/combined.log`, and add a unit test under `middleware/test` that hits the route using supertest.
```

- Add CORS config for local dev:

```
Update `middleware/src/index.ts` to read `ALLOWED_ORIGINS` from `.env` and add `http://localhost:4200` by default in development. Show minimal code change and include a unit test for the CORS middleware behavior.
```

-- Packages (shared utilities)

- Port manager test:

```
Write a Jest test for `packages/port-manager/src/index.ts` verifying `assignPort(config)` returns an unused port and updates `config/ports.json` in-memory (use a mock FS or temp copy).
```

- Agent message helper:

```
Implement `packages/agent/src/utils/formatMessage.ts` to convert internal message objects to the agent API shape, including ensuring conversation history is attached and sanitizing user input. Add types and tests.
```

-- Tests & CI prompts

- Add a basic CI job for lint/build/test:

```
Create `.github/workflows/ci.yml` with jobs: checkout, node setup (node 18), `npm install --workspaces`, `npm run build --workspaces`, `npm test`. Keep the job minimal and fast; skip `./install.sh`.
```

-- Debugging prompts

- Reproduce middleware connectivity failure:

```
Run `curl -v http://localhost:4199/api/hub/apps` and paste the output. Explain why the hub might show `ERR_BLOCKED_BY_CLIENT` and list 3 immediate checks (adblock whitelist, middleware logs tail, lsof check of port 4199). Provide the commands.
```

-- Good prompt hygiene

- When using Copilot Chat, always:
  - Attach the file path(s) you’re working on.
  - Ask for small, incremental patches (1–2 files) rather than broad refactors.
  - Request unit tests with each behavioral change.

If you want, I can expand this into categorized files (Hub prompts / Middleware prompts / Package prompts) or generate example PR descriptions for common tasks.
