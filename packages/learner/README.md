# @assisant-ai/learner

Organic learning system for understanding users through natural conversation.

## Philosophy

The learner system learns about users **organically** - through normal conversation, without being creepy or intrusive. It extracts insights naturally and uses them to provide better, more personalized service.

## Key Features

- ✅ **Natural Learning**: Learns through conversation, not questionnaires
- ✅ **Confidence Scoring**: Only uses high-confidence insights
- ✅ **Privacy-Focused**: All data stored locally
- ✅ **Non-Intrusive**: Learning happens in background
- ✅ **Automatic**: No manual setup required

## Usage

### Automatic Learning

Learning happens automatically when using the agent:

```typescript
import { AgentClient } from '@assisant-ai/agent';

const agent = new AgentClient('http://localhost:3000', token);

// Learning happens automatically in the background
const response = await agent.sendMessage("I prefer dark mode");
// System learns: preference.dark_mode = true
```

### Getting Insights

```typescript
import { Learner } from '@assisant-ai/learner';

const learner = new Learner('http://localhost:3000', token);

// Get all insights
const insights = await learner.getInsights();

// Get insights by category
const preferences = await learner.getInsights('preference');

// Get specific insight
const designStyle = await learner.getInsight('preference', 'design_style');
```

### Personalization Context

Get formatted context for agent personalization:

```typescript
const context = await learner.getPersonalizationContext();
// Returns: "User preferences: dark_mode: true. User interests: 3D printing."
```

## Insight Categories

- **preference**: User preferences (design style, communication style, etc.)
- **interest**: Topics user is interested in
- **goal**: What user wants to achieve
- **pattern**: Behavioral patterns
- **context**: Situational information
- **skill**: What user knows or is learning

## API

### `learnFromConversation(message, response, context?)`
Learn from a conversation exchange (usually called automatically).

### `getInsights(category?)`
Get user insights, optionally filtered by category.

### `getPersonalizationContext()`
Get formatted context string for agent personalization.

### `getInsight(category, key)`
Get a specific insight value.

## Integration

The learner is automatically integrated with:
- Agent message system
- Conversation history
- PersonalAI backend

No manual integration needed - it just works!

## Privacy

- All data stored locally
- No cloud storage
- No third-party sharing
- User has full control

See [Learning System Documentation](../../docs/LEARNING_SYSTEM.md) for details.

