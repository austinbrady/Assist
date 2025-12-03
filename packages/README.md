# Shared Packages

This directory contains shared packages used by all AssisantAI apps.

## Packages

### `@assisant-ai/auth`

Unified authentication package providing:
- Login/register functionality
- Token management
- User session handling
- Works in browser and Node.js

**Usage:**
```typescript
import { AuthClient } from '@assisant-ai/auth';

const auth = new AuthClient('http://localhost:3000');
const { token, user } = await auth.login(email, password);
```

### `@assisant-ai/agent`

Shared agent infrastructure providing:
- Agent message sending
- Conversation history
- Agent state management
- Cross-app continuity
- **Automatic learning integration** - Learns from conversations to better understand users
- **Automatic personalization** - Uses user insights to personalize responses

**Usage:**
```typescript
import { AgentClient } from '@assisant-ai/agent';

const agent = new AgentClient('http://localhost:3000', token);
// Automatically learns from conversations and personalizes responses
const response = await agent.sendMessage('Hello!', {}, 'app-id');

// Access learner directly if needed
const learner = agent.getLearner();
const insights = await learner.getInsights();
```

**Features:**
- Automatically learns from every conversation (enabled by default)
- Automatically uses personalization context (enabled by default)
- Can be disabled: `agent.setAutoLearn(false)` or `agent.setAutoPersonalize(false)`

### `@assisant-ai/learner`

Organic learning system that:
- Learns about users naturally through conversation
- Extracts insights (preferences, interests, goals, patterns)
- Provides personalization context for the agent
- Works seamlessly with the agent package

**Usage:**
```typescript
import { Learner } from '@assisant-ai/learner';

const learner = new Learner('http://localhost:3000', token);
// Learn from a conversation
await learner.learnFromConversation('I love Python', 'That\'s great!', context);

// Get user insights
const insights = await learner.getInsights('preference');

// Get personalization context for agent
const context = await learner.getPersonalizationContext();
```

**Note:** The learner is automatically integrated into `@assisant-ai/agent` - you typically don't need to use it directly.

## Development

To work on these packages:

```bash
# Build a package
cd packages/auth
npm run build

# Watch mode
npm run dev
```

## Adding a New Package

1. Create directory: `packages/my-package`
2. Add `package.json` with name `@assisant-ai/my-package`
3. Add to root `package.json` workspaces
4. Build and export from `src/index.ts`

## Publishing

These packages are meant to be used internally within the monorepo. If you need to publish them:

```bash
npm publish --workspace=packages/auth
```

