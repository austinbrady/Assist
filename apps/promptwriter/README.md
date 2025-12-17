# Prompt Writer

**Core Component of AssisantAI Skeleton**

Prompt Writer is a foundational service that optimizes user prompts before they reach the main AI agent. It rewrites prompts to be more AI-friendly, reducing processing intensity and improving understanding.

## Purpose

Prompt Writer serves as an intelligent preprocessor that:
- **Optimizes prompts** for better AI comprehension
- **Reduces processing intensity** on the main AI agent
- **Improves clarity** and removes ambiguities
- **Preserves user intent** while enhancing structure

## Architecture

Prompt Writer is integrated into the AssisantAI skeleton at the middleware level. When a user sends a message:

1. **User sends prompt** → Middleware receives it
2. **Prompt Writer optimizes** → Rewrites the prompt for AI-friendliness
3. **Optimized prompt** → Sent to main AI agent (PersonalAI or unified LLM)
4. **Response** → Returned to user

## Features

- **Three optimization levels:**
  - **Minimal**: Light touch, preserves original intent
  - **Balanced**: Moderate optimization (recommended)
  - **Aggressive**: Maximum optimization for AI processing

- **Context-aware**: Uses conversation history and context to improve optimization

- **Automatic integration**: Enabled by default in middleware, can be disabled via `USE_PROMPT_WRITER=false`

## Installation

```bash
cd apps/promptwriter/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cd ../frontend
npm install
```

## Running

### Backend
```bash
cd apps/promptwriter/backend
./START.sh
```

### Frontend
```bash
cd apps/promptwriter/frontend
npm run dev
```

Or use the main startup script:
```bash
./start.sh  # From project root
```

## API

### POST `/api/rewrite`

Rewrites a user prompt to be more AI-friendly.

**Request:**
```json
{
  "prompt": "can u help me make a thing that does stuff",
  "context": {},
  "conversation_history": [],
  "optimization_level": "balanced"
}
```

**Response:**
```json
{
  "original_prompt": "can u help me make a thing that does stuff",
  "optimized_prompt": "Create a tool or application that performs specific tasks or functions.",
  "improvements": ["Improved clarity", "Enhanced AI-friendliness"],
  "optimization_level": "balanced"
}
```

## Configuration

Set in `.env`:
```bash
PROMPT_WRITER_BASE_URL=http://localhost:4206
USE_PROMPT_WRITER=true  # Set to false to disable
```

## Integration

Prompt Writer is automatically integrated into the middleware's agent route. All user messages are optimized before being sent to the main AI agent.

To disable:
```bash
USE_PROMPT_WRITER=false
```

## Development

Prompt Writer is designed to be improved by Assist itself. You can use Assist to:
- Improve the optimization algorithms
- Add new optimization strategies
- Enhance context understanding
- Refine prompt rewriting logic

## Ports

- **Backend**: 4206
- **Frontend**: 4205

## Status

✅ **Core Implementation Complete**
- Backend API with prompt rewriting
- Frontend UI for testing
- Middleware integration
- Automatic prompt optimization

🚧 **Future Enhancements**
- Advanced optimization strategies
- Learning from optimization results
- Custom optimization rules
- Performance metrics and analytics

