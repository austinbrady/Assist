# Prompt Writer Integration Guide

Prompt Writer is now fully integrated as a backend service that can interact with users through the chat agent.

## Features

1. **Automatic Prompt Optimization**: All user messages are automatically optimized before reaching the main AI agent
2. **User Clarification**: Prompt Writer can ask users questions when prompts are ambiguous
3. **Chat Integration**: Questions are sent directly through the chat interface
4. **Backend Service**: Runs as a core backend component, not a separate app

## How It Works

### 1. Automatic Optimization Flow

```
User Message → Middleware → Prompt Writer → Optimized Message → Main AI Agent
```

### 2. Clarification Flow

```
User Message → Prompt Writer detects ambiguity → Ask user via chat → 
User responds → Prompt Writer optimizes with clarification → Main AI Agent
```

## API Endpoints

### POST `/api/rewrite`
Basic prompt rewriting (no user interaction)

### POST `/api/rewrite-with-clarification`
Advanced rewriting that can ask user questions if needed

### POST `/api/ask-user`
Directly ask the user a question through the chat agent

## Configuration

Set in `.env`:
```bash
PROMPT_WRITER_BASE_URL=http://localhost:4206
USE_PROMPT_WRITER=true  # Set to false to disable
MIDDLEWARE_URL=http://localhost:4199
PERSONAL_AI_BASE_URL=http://localhost:4202
```

## Usage in Code

The middleware automatically uses Prompt Writer for all agent messages. No code changes needed in your application - it's transparent.

## Development

To improve Prompt Writer using Assist:

1. Switch to ProjectMode
2. Open Prompt Writer project files
3. Use the chat agent to discuss improvements
4. The agent can help rewrite and improve Prompt Writer itself

This creates a self-improving system where Assist helps improve Assist!

