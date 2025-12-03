# PersonalAI

PersonalAI is a child app of **AssistantAI**. It provides comprehensive local AI assistant capabilities including chat, image/video generation, song writing, and 20+ automation skills.

## Location

This app is located at: `apps/personalai/` within the AssistantAI project.

## Ports

- **Backend**: Port 4200 (managed by AssistantAI port manager)
- **Frontend**: Port 4201 (managed by AssistantAI port manager)

Ports are assigned automatically by AssistantAI's port management system.

## Installation

When AssistantAI runs its installer, PersonalAI is automatically installed. You can also install manually:

```bash
# From AssistantAI root
cd apps/personalai
npm run install:backend
npm run install:frontend
```

## Starting PersonalAI

### Via AssistantAI Hub

The easiest way is through the AssistantAI Central Hub dashboard at http://localhost:4000

### Manually

```bash
# From AssistantAI root
cd apps/personalai
./start.sh
```

Or set environment variables and start:

```bash
export PERSONALAI_BACKEND_PORT=4200
export PERSONALAI_FRONTEND_PORT=4201
cd apps/personalai
./start.sh
```

## Structure

```
apps/personalai/
├── backend/          # FastAPI backend (Python)
├── frontend/         # Next.js frontend (TypeScript/React)
├── mobile/          # React Native mobile app
├── start.sh         # Start script for AssistantAI
├── package.json     # App package configuration
└── README.md        # This file
```

## Features

- **Chat**: Unrestricted AI conversations with 7 biblical archangel assistants
- **Image Generation & Editing**: Create and edit images from text prompts
- **Video Generation & Editing**: Generate and process videos
- **Song Writing**: Write songs with "For fans of" inspiration
- **Skills System**: 20+ automation skills including:
  - Email Management
  - Calendar & Scheduling
  - To-Do List
  - Bills & Budget
  - Business Manager
  - CRM
  - Code Assistance
  - And more...

## Integration with AssistantAI

PersonalAI serves as the **base backend** for the AssistantAI ecosystem:
- Provides authentication and user management
- Handles agent infrastructure and persistence
- Manages conversation history
- Executes skills and automation

All AssistantAI apps share:
- The same agent (same personality and memory)
- Unified authentication
- Cross-app data sharing

## Standalone Usage

PersonalAI can still be used standalone (from its original location), but when used as part of AssistantAI:
- Installation is managed by AssistantAI
- Ports are assigned automatically
- Management is through AssistantAI's hub dashboard
- Integration with other apps is automatic

## Documentation

- Main README: See `README.md` in the PersonalAI root
- Parent Project: See `PARENT_PROJECT.md` in the PersonalAI root
- AssistantAI Docs: See `/Volumes/Austin's Flash Drive (Mac)/AssisantAI/docs/`
