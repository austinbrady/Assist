# MVP Assistant

MVP Assistant is a **child app** of the **AssistantAI** master project. It dynamically generates custom GUI applications to solve user problems.

## Parent Project

This app is managed by **AssistantAI**. See [PARENT_PROJECT.md](./PARENT_PROJECT.md) for details.

## Quick Start

### Standalone Usage

1. **Install dependencies:**
   ```bash
   ./INSTALL.sh
   ```

2. **Start the application:**
   ```bash
   ./START.sh
   ```

3. **Access:**
   - Frontend: http://localhost:4202
   - Backend: http://localhost:4203

### Managed by AssistantAI

When running under AssistantAI:
- Installation is handled by AssistantAI
- Management is through AssistantAI's hub dashboard
- Ports are assigned automatically (4202 frontend, 4203 backend)
- Integration with PersonalAI and other apps is automatic

## Architecture

- **Backend**: FastAPI (Python) - Port 4203
- **Frontend**: Next.js (React/TypeScript) - Port 4202
- **Mobile**: React Native/Expo (iOS/Android)

## Features

- **Dynamic App Generation**: Builds apps/skills on-demand based on user problems
- **No Premade Skills**: Everything is generated when the user needs it
- **Full GUI Applications**: Creates complete applications, not just skill functions
- **Problem-Driven**: User describes a problem → AI analyzes → generates solution
- **99% GUI Preference**: Almost always creates GUI applications with data persistence, history tracking, exports, visualizations

## Integration with AssistantAI

MVP Assistant routes all requests through AssistantAI master controller:
- Authentication → AssistantAI
- Chat → AssistantAI (with PersonalAI sync)
- Conversations → AssistantAI
- Solutions → AssistantAI

All apps share the same AI agent, authentication, and conversation history through AssistantAI.
