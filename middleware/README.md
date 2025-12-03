# AssisantAI Middleware

The middleware layer that connects all AI assistant apps to the unified PersonalAI backend.

## Features

- Unified authentication proxy
- Agent communication routing
- User data management
- Cross-app request proxying
- Request logging and error handling

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Configure apps:**
   Edit `config/apps.json` with your app endpoints

4. **Build:**
   ```bash
   npm run build
   ```

5. **Run:**
   ```bash
   npm start
   ```

   Or in development:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify token

### Agent
- `GET /api/agent/state` - Get agent state
- `POST /api/agent/message` - Send message to agent
- `GET /api/agent/history` - Get conversation history
- `PUT /api/agent/preferences` - Update agent preferences

### User
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/data` - Get unified user data

### Apps
- `GET /api/apps` - List connected apps
- `POST /api/apps/:appId/proxy` - Proxy request to app

### Health
- `GET /health` - Health check

## Configuration

### Environment Variables

See `.env.example` for all available options.

Key variables:
- `PORT` - Server port (default: 3000)
- `PERSONAL_AI_BASE_URL` - PersonalAI backend URL
- `JWT_SECRET` - JWT signing secret
- `ALLOWED_ORIGINS` - CORS allowed origins

### Apps Configuration

Edit `config/apps.json` to register your apps:

```json
{
  "apps": [
    {
      "id": "my-app",
      "name": "My App",
      "baseUrl": "http://localhost:3001",
      "enabled": true
    }
  ]
}
```

## Development

```bash
# Watch mode
npm run dev

# Build
npm run build

# Test
npm test
```

## Logging

Logs are written to:
- Console (development)
- `logs/error.log` (errors only)
- `logs/combined.log` (all logs)

## Security

- All protected routes require JWT authentication
- CORS is configured for allowed origins only
- Helmet.js provides security headers
- Request logging for audit trails

