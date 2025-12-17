# Prompt Writer Integration

Prompt Writer is now fully integrated as a backend service that runs automatically and can interact with users through the chat interface.

## Architecture

```
User Message
    ↓
Middleware (/api/agent/message)
    ↓
Prompt Writer Backend (port 4206)
    ├─ Analyzes prompt
    ├─ If ambiguous → Asks user via chat
    ├─ User responds → Combines with original
    └─ Optimizes prompt
    ↓
Main AI Agent (PersonalAI or Unified LLM)
    ↓
Response to User
```

## Features

### 1. Automatic Prompt Optimization
- All user messages are automatically optimized before reaching the main AI
- Reduces processing intensity on the main agent
- Improves AI understanding of user requests

### 2. User Clarification
- Prompt Writer can detect ambiguous prompts
- Asks clarification questions directly through the chat
- User's response is combined with original message
- Final optimized prompt is sent to main agent

### 3. Backend Integration
- Runs as a core backend service (port 4206)
- Automatically started with `./start.sh`
- Integrated into middleware agent route
- No frontend needed for core functionality

## How It Works

### Normal Flow (No Clarification Needed)
1. User sends: "make a todo app"
2. Prompt Writer optimizes: "Create a task management application with the ability to add, edit, delete, and mark tasks as complete"
3. Optimized prompt sent to main AI
4. AI responds with implementation

### Clarification Flow
1. User sends: "make it better"
2. Prompt Writer detects ambiguity
3. Chat displays: "🤔 **Prompt Writer needs clarification:** What would you like me to improve? Please respond with more details."
4. User responds: "add dark mode and keyboard shortcuts"
5. Prompt Writer combines: "make it better\n\nUser clarification: add dark mode and keyboard shortcuts"
6. Prompt Writer optimizes the combined prompt
7. Optimized prompt sent to main AI
8. AI responds with improvements

## Configuration

In `.env`:
```bash
# Prompt Writer Configuration
PROMPT_WRITER_BASE_URL=http://localhost:4206
USE_PROMPT_WRITER=true  # Set to false to disable

# Required for Prompt Writer to ask questions
MIDDLEWARE_URL=http://localhost:4199
PERSONAL_AI_BASE_URL=http://localhost:4202
```

## API Endpoints

### POST `/api/rewrite`
Basic prompt rewriting (no user interaction)

### POST `/api/rewrite-with-clarification`
Advanced rewriting that can ask user questions if needed

### POST `/api/ask-user`
Format a question for display in chat (used internally)

## Development Workflow

The goal is to use Assist to improve Prompt Writer itself:

1. **Switch to ProjectMode** (toggle button in toolbar)
2. **Open Prompt Writer project** in the file tree
3. **Use the chat agent** to discuss improvements
4. **The agent helps rewrite** Prompt Writer code
5. **Iterate and improve** using the same system

This creates a self-improving loop where Assist helps improve Assist!

## Status

✅ **Fully Integrated**
- Backend service running on port 4206
- Automatic prompt optimization enabled
- User clarification system working
- Integrated into middleware agent route

🚧 **Future Enhancements**
- Learn from optimization results
- Custom optimization rules per user
- Performance metrics and analytics
- A/B testing different optimization strategies

