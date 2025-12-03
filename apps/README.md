# Apps Directory

This directory contains individual AI assistant applications that are part of the AssisantAI ecosystem.

## Structure

Each app should:
- Use `@assisant-ai/auth` for authentication
- Use `@assisant-ai/agent` for agent communication
- Connect through the middleware layer
- Share user identity and agent state

## Adding a New App

1. **Create app directory:**
   ```bash
   mkdir apps/my-new-app
   cd apps/my-new-app
   ```

2. **Initialize your app** (React, Next.js, etc.)

3. **Install shared packages:**
   ```bash
   npm install @assisant-ai/auth @assisant-ai/agent
   ```

4. **Integrate authentication:**
   ```typescript
   import { AuthClient } from '@assisant-ai/auth';
   // ... use AuthClient
   ```

5. **Integrate agent:**
   ```typescript
   import { AgentClient } from '@assisant-ai/agent';
   // ... use AgentClient
   ```

6. **Configure environment:**
   ```env
   MIDDLEWARE_URL=http://localhost:3000
   ```

7. **Register in middleware:**
   Edit `middleware/config/apps.json` to add your app

## Example Apps

See the integration guide in `docs/INTEGRATION_GUIDE.md` for detailed examples.

## App Requirements

- Must use unified authentication
- Must use shared agent infrastructure
- Must register in middleware config
- Should follow the same agent personality
- Should share user data through middleware

