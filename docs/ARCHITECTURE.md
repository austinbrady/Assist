# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Applications                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    App 1     │  │    App 2     │  │    App N     │      │
│  │              │  │              │  │              │      │
│  │ Uses:        │  │ Uses:        │  │ Uses:        │      │
│  │ @auth        │  │ @auth        │  │ @auth        │      │
│  │ @agent       │  │ @agent       │  │ @agent       │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
└─────────┼─────────────────┼─────────────────┼───────────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
          ┌─────────────────▼─────────────────┐
          │      Middleware Layer              │
          │  ┌─────────────────────────────┐  │
          │  │  Authentication Routes      │  │
          │  │  Agent Routes               │  │
          │  │  User Routes                │  │
          │  │  App Proxy Routes           │  │
          │  └─────────────────────────────┘  │
          └─────────────────┬──────────────────┘
                            │
          ┌─────────────────▼──────────────────┐
          │    PersonalAI Backend (Base)        │
          │  ┌──────────────────────────────┐  │
          │  │  User Management             │  │
          │  │  Authentication              │  │
          │  │  Agent State & Memory        │  │
          │  │  Conversation History        │  │
          │  │  Data Persistence            │  │
          │  └──────────────────────────────┘  │
          └─────────────────────────────────────┘
```

## Components

### 1. User Applications (Apps)

Individual AI assistant applications that:
- Use `@assisant-ai/auth` for authentication
- Use `@assisant-ai/agent` for agent communication
- Communicate through middleware layer
- Share user identity and agent state

### 2. Middleware Layer

Express.js server that:
- Provides unified API endpoints
- Handles authentication and authorization
- Proxies requests to PersonalAI backend
- Manages app routing and configuration
- Provides cross-app communication

**Key Endpoints:**
- `/api/auth/*` - Authentication (login, register, verify)
- `/api/agent/*` - Agent communication (message, history, state)
- `/api/user/*` - User profile and data
- `/api/apps/*` - App management and proxying

### 3. PersonalAI Backend (Base)

The base backend infrastructure that provides:
- User account management
- Authentication and session management
- Agent state persistence
- Conversation history storage
- Cross-app data sharing

### 4. Shared Packages

#### `@assisant-ai/auth`
- Unified authentication client
- Token management
- User session handling

#### `@assisant-ai/agent`
- Agent communication client
- Message sending
- History retrieval
- State management

## Data Flow

### Authentication Flow

```
User → App → @auth package → Middleware → PersonalAI → Database
                                      ↓
User ← App ← Token & User Info ←──────┘
```

### Agent Communication Flow

```
User → App → @agent package → Middleware → PersonalAI → Agent Service
                                                      ↓
User ← App ← Agent Response ←────────────────────────┘
```

### Cross-App Data Flow

```
App 1 → Middleware → PersonalAI → Database
                              ↓
App 2 ← Middleware ←──────────┘
```

## Security

- **JWT Tokens**: All authentication uses JWT tokens
- **Token Validation**: Middleware validates all tokens with PersonalAI
- **CORS**: Configured to allow only specified origins
- **Helmet**: Security headers for middleware
- **Environment Variables**: Sensitive data in `.env` files

## Configuration

### Middleware Configuration

- `middleware/.env`: Environment variables
- `middleware/config/apps.json`: App registry

### App Configuration

Each app should configure:
- `MIDDLEWARE_URL`: URL of middleware server
- `PERSONAL_AI_BASE_URL`: URL of PersonalAI backend (optional, usually via middleware)

## Deployment

1. **PersonalAI Backend**: Deploy first (base infrastructure)
2. **Middleware**: Deploy second (connects apps to backend)
3. **Apps**: Deploy last (connect to middleware)

All components should be configured with production URLs and secrets.

## Scalability

- Middleware can be horizontally scaled
- PersonalAI backend handles data persistence
- Apps are stateless (state in PersonalAI)
- Load balancing can be added at middleware layer

