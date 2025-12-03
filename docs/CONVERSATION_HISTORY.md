# Conversation History Management

## Core Principle: Always Send Full History

**By default, every message sent to the agent includes the complete conversation history.** This ensures the agent always understands where you are in the conversation and maintains context across all interactions.

## Why This Matters

Without full conversation history, agents can:
- Lose track of what was discussed earlier
- Forget important context or preferences
- Repeat information already covered
- Miss connections between messages

With full conversation history, agents:
- ✅ Remember everything discussed
- ✅ Maintain context throughout the conversation
- ✅ Build on previous exchanges
- ✅ Understand references to earlier messages

## How It Works

### Automatic History Inclusion

When you send a message using the `AgentClient`:

```typescript
import { AgentClient } from '@assisant-ai/agent';

const agent = new AgentClient();
const response = await agent.sendMessage("What did we discuss earlier?");
```

**Behind the scenes:**
1. Agent client automatically fetches conversation history
2. Includes full history with the message
3. Sends everything to the agent
4. Agent responds with full context

### Manual Control

If you need to send a message without history (rare cases):

```typescript
// Send message without history
const response = await agent.sendMessage(
  "Start a new conversation",
  undefined, // context
  undefined, // appId
  false // includeHistory = false
);
```

## Implementation Details

### Agent Client (`@assisant-ai/agent`)

The `AgentClient.sendMessage()` method:
- **Default behavior**: Automatically fetches and includes conversation history
- **History limit**: Last 100 messages (configurable)
- **Error handling**: If history fetch fails, message still sends (graceful degradation)

### Middleware Layer

The middleware:
- Accepts conversation history in the request
- If not provided, automatically fetches it
- Always forwards full history to PersonalAI backend
- Ensures consistency across all apps

### PersonalAI Backend

The backend:
- Receives full conversation history
- Uses it to maintain context
- Stores new messages in history
- Returns response with updated history

## Best Practices for App Developers

### ✅ DO: Use Default Behavior

```typescript
// This automatically includes full history
const response = await agent.sendMessage(userMessage);
```

### ✅ DO: Let History Be Automatic

The agent client handles history automatically. You don't need to:
- Manually fetch history before sending messages
- Manage history state in your app
- Worry about context loss

### ✅ DO: Trust the System

The conversation history system is designed to:
- Work automatically
- Handle errors gracefully
- Maintain consistency
- Preserve context

### ❌ DON'T: Manually Manage History

```typescript
// ❌ Don't do this - it's redundant
const history = await agent.getHistory();
const response = await agent.sendMessage(message, { history });
```

### ❌ DON'T: Disable History Unless Necessary

```typescript
// ❌ Only disable if you have a specific reason
const response = await agent.sendMessage(message, undefined, undefined, false);
```

## Conversation History Format

History is an array of messages:

```typescript
interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  appId?: string; // Which app the message came from
}
```

Example:
```json
{
  "messages": [
    {
      "role": "user",
      "content": "I need a phone stand",
      "timestamp": "2024-01-01T10:00:00Z",
      "appId": "3d-printing-assistant"
    },
    {
      "role": "assistant",
      "content": "I'll design that for you. What's your phone model?",
      "timestamp": "2024-01-01T10:00:01Z",
      "appId": "3d-printing-assistant"
    },
    {
      "role": "user",
      "content": "iPhone 15 Pro",
      "timestamp": "2024-01-01T10:00:30Z",
      "appId": "3d-printing-assistant"
    }
  ]
}
```

## Cross-App Context

Conversation history includes messages from all apps:

- **Same agent**: All apps share the same agent
- **Shared history**: History includes messages from all apps
- **Context preservation**: Agent remembers conversations across apps

Example:
```
User (in 3D Printing app): "I'm working on a product for my startup"
User (in Logo Designer app): "Let's work on that logo we discussed"
Agent: "Yes! For your startup. I remember you wanted something modern..."
```

## Performance Considerations

### History Limit

- **Default**: Last 100 messages
- **Configurable**: Can be adjusted per request
- **Reason**: Balances context with performance

### Caching

- History is fetched fresh each time
- No caching to ensure accuracy
- Fast enough for real-time use

### Error Handling

- If history fetch fails, message still sends
- Agent works with available context
- System degrades gracefully

## Troubleshooting

### Agent Seems to Forget Context

**Check:**
1. Is history being included? (Check network requests)
2. Is the history limit too low?
3. Are messages being stored correctly?

**Solution:**
- Increase history limit
- Check middleware logs
- Verify PersonalAI backend is storing messages

### History Not Loading

**Check:**
1. Is authentication working?
2. Is middleware accessible?
3. Is PersonalAI backend running?

**Solution:**
- Verify token is valid
- Check middleware health endpoint
- Ensure PersonalAI backend is running

### Performance Issues

**Check:**
1. How many messages in history?
2. Is history limit too high?
3. Network latency?

**Solution:**
- Reduce history limit
- Optimize history fetching
- Consider pagination for very long conversations

## Configuration

### Adjusting History Limit

In your app:
```typescript
// Get more history
const history = await agent.getHistory(200, 0, appId);

// Then send with that history
const response = await agent.sendMessage(message);
```

### App-Specific History

Filter by appId:
```typescript
// Get history for specific app
const history = await agent.getHistory(50, 0, 'my-app-id');
```

## Summary

**Key Points:**
- ✅ Full conversation history is sent by default
- ✅ This ensures agents understand context
- ✅ Works automatically - no manual management needed
- ✅ Handles errors gracefully
- ✅ Maintains consistency across all apps

**For Developers:**
- Use `agent.sendMessage()` - it handles everything
- Don't manually manage history
- Trust the automatic system
- Only disable history if absolutely necessary

---

*"Context is everything. That's why we always send the full conversation."*

