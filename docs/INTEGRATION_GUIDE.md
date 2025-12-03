# Integration Guide

This guide explains how to integrate existing AI assistant apps into the AssisantAI unified infrastructure.

## Overview

The AssisantAI master project provides:
- **Unified Authentication**: Single sign-on across all apps
- **Shared Agent**: Same AI agent personality and memory
- **Cross-App Data**: Shared user data and conversation history
- **Middleware Layer**: Connects all apps to PersonalAI backend

## Step 1: Analyze Your Apps

Use the analysis tool to examine your existing apps:

```bash
python tools/analyze_apps.py --app1 /path/to/app1 --app2 /path/to/app2
```

This will generate:
- `analysis_results.json`: Detailed analysis of each app
- `integration_guide.json`: Step-by-step integration recommendations

## Step 2: Update App Configuration

Edit `middleware/config/apps.json` with your app details:

```json
{
  "apps": [
    {
      "id": "my-app-1",
      "name": "My First App",
      "baseUrl": "http://localhost:3001",
      "description": "Description of your app",
      "enabled": true
    }
  ]
}
```

## Step 3: Integrate Authentication

Replace your app's authentication with the unified auth package:

### For Node.js/TypeScript Apps

```typescript
import { AuthClient } from '@assisant-ai/auth';

const auth = new AuthClient('http://localhost:3000');

// Login
const { token, user } = await auth.login(email, password);
AuthClient.storeToken(token);

// Get current user
const token = AuthClient.getToken();
const user = await auth.getCurrentUser(token);
```

### For React Apps

```typescript
import { AuthClient } from '@assisant-ai/auth';

function LoginComponent() {
  const [auth] = useState(new AuthClient());
  
  const handleLogin = async (email: string, password: string) => {
    const { token, user } = await auth.login(email, password);
    AuthClient.storeToken(token);
    // Update app state
  };
}
```

## Step 4: Integrate Agent

Replace your app's agent integration with the shared agent package:

```typescript
import { AgentClient } from '@assisant-ai/agent';

const agent = new AgentClient('http://localhost:3000', token);

// Send message - automatically includes full conversation history!
// The agent will always have complete context of the conversation
const response = await agent.sendMessage(
  "Hello!",
  { context: "optional context" },
  "my-app-1" // Your app ID
);

// Get history (usually not needed - history is included automatically)
const history = await agent.getHistory(50, 0, "my-app-1");
```

**Important**: The `sendMessage()` method automatically includes the full conversation history with each message. This ensures the agent always understands where you are in the conversation. You don't need to manually manage history - it's handled automatically.

See [Conversation History Guide](CONVERSATION_HISTORY.md) for details.

## Step 5: Update API Endpoints

If your app has its own API endpoints, you can:

1. **Proxy through middleware**: Use the middleware proxy endpoint
2. **Keep local endpoints**: But ensure they use unified auth
3. **Migrate to middleware**: Move endpoints to middleware for shared access

### Proxy Example

```typescript
// In your app
const response = await fetch('http://localhost:3000/api/apps/my-app-1/proxy', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    endpoint: '/api/my-endpoint',
    method: 'POST',
    data: { /* your data */ }
  })
});
```

## Step 6: Update Environment Variables

Add to your app's `.env`:

```env
MIDDLEWARE_URL=http://localhost:3000
PERSONAL_AI_BASE_URL=http://localhost:4000
```

## Step 7: Test Integration

1. Start PersonalAI backend (if not already running)
2. Start middleware: `npm run start:middleware`
3. Start your app
4. Test login/logout across apps
5. Test agent conversation continuity

## Migration Checklist

- [ ] Run analysis tool on your app
- [ ] Update `middleware/config/apps.json`
- [ ] Replace authentication with `@assisant-ai/auth`
- [ ] Replace agent integration with `@assisant-ai/agent`
- [ ] Update API endpoints to use middleware
- [ ] Update environment variables
- [ ] Test cross-app authentication
- [ ] Test shared agent conversations
- [ ] Test shared user data

## Common Issues

### Authentication Not Working

- Verify PersonalAI backend is running
- Check `PERSONAL_AI_BASE_URL` in middleware `.env`
- Verify JWT_SECRET matches between services

### Agent Not Responding

- Check middleware is running
- Verify token is being sent in requests
- Check PersonalAI agent endpoints are accessible

### CORS Errors

- Update `ALLOWED_ORIGINS` in middleware `.env`
- Ensure your app's origin is included

## Next Steps

After integration:
1. Deploy PersonalAI backend
2. Deploy middleware
3. Deploy your apps
4. Configure production URLs
5. Set up monitoring and logging

