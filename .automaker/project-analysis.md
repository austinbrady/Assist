# AssisantAI - Project Analysis Summary

## 1. Project Structure and Architecture

### Directory Overview

```
AssisantAI/
├── apps/                          # Child AI assistant applications
│   ├── personalai/               # Base backend + frontend
│   │   ├── backend/              # Python FastAPI backend (port 4202)
│   │   ├── frontend/             # Next.js React frontend (port 4203)
│   │   └── mobile/               # Mobile application
│   ├── mvpassistant/             # MVP Assistant application
│   └── promptwriter/             # Prompt Writer application
│
├── packages/                      # Shared TypeScript packages (Monorepo)
│   ├── auth/                     # Unified authentication (@assisant-ai/auth)
│   ├── agent/                    # Shared agent infrastructure (@assisant-ai/agent)
│   ├── learner/                  # Organic learning system (@assisant-ai/learner)
│   └── port-manager/             # Port management utility
│
├── hub/                           # Central hub dashboard (port 4200)
├── middleware/                    # API middleware layer (port 4199)
├── extension/                     # Browser extension
├── config/                        # Configuration files (ports.json, apps.json)
├── docs/                          # Documentation
└── [startup scripts]              # INSTALL.sh, start, stop, launch.py
```

### Architectural Pattern

**Monorepo with Unified Identity Pattern:**
- Single npm workspace at root
- Multiple child applications in `apps/`
- Shared packages in `packages/`
- Central orchestration via `middleware/` and `hub/`
- **Core Philosophy**: "One Agent, Many Bodies, One Mind" - single AI maintains personality across all apps

---

## 2. Main Technologies and Frameworks

### Frontend Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.0.4 | React framework |
| React | 18.2.0 | UI library |
| Tailwind CSS | 3.3.6 | Styling |
| TypeScript | 5.3.3 | Type safety |
| Axios | 1.6.2 | HTTP client |

### Backend Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| FastAPI | 0.104.1 | Python backend framework |
| Express | 4.18.2 | Node.js middleware |
| Uvicorn | 0.24.0 | ASGI server |
| Pydantic | 2.5.0 | Data validation |

### AI/ML Stack
| Technology | Purpose |
|------------|---------|
| LangChain | LLM orchestration |
| Ollama | Local LLM inference |
| Chroma | Vector database |
| AudioCraft | Music generation |
| OpenCV | Image processing |

### Requirements
- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **Python**: 3.8+
- **Ollama**: Required for local LLM

---

## 3. Key Components and Responsibilities

### Core Platform Layer

| Component | Port | Responsibility |
|-----------|------|----------------|
| **PersonalAI Backend** | 4202-4204 | Core AI engine, authentication, skill execution, memory management, integrations |
| **Middleware** | 4199 | API gateway, JWT validation, request routing, logging |
| **Central Hub** | 4200 | Dashboard, app orchestration, unified UI |

### PersonalAI Backend Modules
- `auth.py` - Authentication and user management
- `skill_executor.py` - Skill execution engine (largest module)
- `character_manager.py` - AI personality management
- `memory_manager.py` - Conversation memory
- `personality_adaptation.py` - Adaptive AI personality
- Various integrations (email, blockchain, music, video, etc.)

### Shared Packages

| Package | Purpose |
|---------|---------|
| `@assisant-ai/auth` | Unified authentication across all apps |
| `@assisant-ai/agent` | Shared agent infrastructure with LangChain |
| `@assisant-ai/learner` | Organic learning system for personalization |
| `@assisant-ai/port-manager` | Dynamic port assignment |

### Child Applications

| App | Purpose |
|-----|---------|
| **PersonalAI** | Base AI assistant with full capabilities |
| **MVP Assistant** | Problem-driven app generator |
| **Prompt Writer** | Prompt engineering and optimization |

---

## 4. Build and Test Commands

### Installation
```bash
./INSTALL.sh              # Complete setup (recommended)
npm run install:all       # Install all dependencies
```

### Development
```bash
npm run dev:middleware    # Run middleware in dev mode
npm run dev:hub          # Run hub in dev mode
```

### Production
```bash
./start                   # Start all services
./stop                    # Stop all services
npm run start:all         # Alternative start command
```

### Building
```bash
npm run build            # Build all workspaces
npm run test             # Run tests in all workspaces
```

### Port Configuration
| Service | Port |
|---------|------|
| Middleware | 4199 |
| Central Hub | 4200 |
| MVP Assistant Frontend | 4201 |
| PersonalAI Backend | 4202/4204 |
| PersonalAI Frontend | 4203 |
| Prompt Writer | 4205/4206 |

---

## 5. Conventions and Patterns

### Architectural Patterns

1. **Unified Identity Pattern** - One AI agent per user across all apps
2. **Monorepo with Workspaces** - Shared code in `packages/`
3. **API Gateway Pattern** - Middleware as single entry point
4. **JWT Authentication** - Token-based auth on all protected routes

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Packages | `@assisant-ai/{name}` | `@assisant-ai/auth` |
| App IDs | kebab-case | `personalai`, `mvpassistant` |
| Env Variables | UPPERCASE_UNDERSCORES | `PERSONALAI_BACKEND_PORT` |
| Ports | Sequential from 4199 | 4199, 4200, 4201... |

### Code Organization

**Frontend (Next.js App Router)**
```
app/           # Route-based pages
components/    # Reusable components
hooks/         # Custom React hooks
utils/         # Utility functions
```

**Backend (FastAPI)**
```
main.py                    # Entry point
auth.py                    # Authentication
skill_executor.py          # Core logic
[feature]_manager.py       # Feature modules
```

### Learning System Patterns

- **Automatic Learning**: Agent learns from every conversation by default
- **Insight Categories**: Preferences, Interests, Goals, Patterns
- **Confidence Scoring**: High (0.7+), Medium (0.4-0.7), Low (<0.4)
- **Privacy-First**: All processing local, no external data sharing

### Configuration Files

| File | Purpose |
|------|---------|
| `config/ports.json` | Port assignments and app metadata |
| `config/apps.json` | App registry and URLs |
| `.env` files | Environment-specific secrets (gitignored) |

---

## Project Summary

**AssisantAI** is a privacy-first, locally-hosted AI assistant ecosystem featuring:

- **3 Active Applications**: PersonalAI, MVP Assistant, Prompt Writer
- **4 Shared Packages**: Auth, Agent, Learner, Port Manager
- **Modern Stack**: Next.js 14, FastAPI, LangChain, Ollama
- **Browser Extension**: Chrome extension for web integration
- **Comprehensive Documentation**: Architecture docs, vision document, setup guides

The project follows a unified identity pattern where a single AI assistant maintains consistent personality and memory across all applications, providing organic personalization without intrusive data collection.