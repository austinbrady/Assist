# Unified Ollama & Gemini Integration Setup Guide

This guide will help you set up the unified Ollama & Gemini integration, allowing you to seamlessly switch between local Ollama models (like `llama3`) and cloud Gemini models (like `gemini-2.5-flash`) through Ollama's OpenAI-compatible API.

## Step 1: System Prerequisites

### Install/Update Ollama

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Run a Gemini Model

Ollama will automatically connect to Google's cloud service using the API key from your environment:

```bash
ollama run gemini-2.5-flash
```

### Optional: Pull a Local Model for Testing

```bash
ollama pull llama3
```

## Step 2: Configuration File (.env)

Create or update the `.env` file in the project root with the following variables:

```bash
# 1. Your Google AI Studio API Key (Ollama needs this for Gemini access)
# Get your API key from: https://aistudio.google.com/apikey
GEMINI_API_KEY="YOUR_API_KEY_HERE"

# 2. The unified API endpoint (Ollama exposes an OpenAI-compatible API locally)
# Default: http://localhost:11434/v1
LLM_API_BASE_URL="http://localhost:11434/v1"

# 3. Model Selection: Change this value to instantly switch the agent's core LLM.
#    - 'gemini-2.5-flash' uses the cloud service via Ollama (requires GEMINI_API_KEY)
#    - 'llama3' uses your local Ollama installation
#    - 'llama3.2' uses your local Ollama installation
LLM_MODEL="gemini-2.5-flash"

# 4. Enable unified LLM client in middleware
# Set to 'true' to use the unified client, 'false' to route through PersonalAI backend
USE_UNIFIED_LLM_CLIENT="true"

# PersonalAI Backend Configuration (for fallback)
PERSONAL_AI_BASE_URL="http://localhost:4202"

# Middleware Configuration
MIDDLEWARE_URL="http://localhost:4199"
PORT=4199
```

## Step 3: Install Dependencies

The agent package now includes the OpenAI SDK. Install dependencies:

```bash
npm run install:packages
```

Or run the full install:

```bash
./install.sh
```

## Step 4: Build the Agent Package

Build the TypeScript agent package:

```bash
cd packages/agent
npm run build
cd ../..
```

## Step 5: Restart Services

Restart all services to apply the changes:

```bash
./stop.sh
./start.sh
```

## How It Works

### Architecture

1. **Unified Client**: The `packages/agent/src/agent.ts` module creates a single OpenAI client instance that points to Ollama's OpenAI-compatible API endpoint (`http://localhost:11434/v1`).

2. **Model Switching**: By changing the `LLM_MODEL` environment variable, you can instantly switch between:
   - **Cloud Models**: `gemini-2.5-flash` (requires `GEMINI_API_KEY`)
   - **Local Models**: `llama3`, `llama3.2`, etc. (runs entirely locally)

3. **Middleware Integration**: The middleware automatically uses the unified client when `USE_UNIFIED_LLM_CLIENT=true` or when `LLM_API_BASE_URL` and `LLM_MODEL` are configured. Otherwise, it falls back to routing through the PersonalAI backend.

### Features

- **Seamless Model Switching**: Change models by updating `LLM_MODEL` in `.env`
- **Automatic Personalization**: Integrates with the learner system for personalized responses
- **Conversation History**: Maintains full conversation context
- **Background Learning**: Automatically learns from conversations (non-blocking)
- **Fallback Support**: Falls back to PersonalAI backend if unified client fails

## Usage Examples

### Switch to Local Model

```bash
# In .env file
LLM_MODEL="llama3"
```

### Switch to Cloud Model

```bash
# In .env file
LLM_MODEL="gemini-2.5-flash"
GEMINI_API_KEY="your-api-key-here"
```

### Disable Unified Client (Use PersonalAI Backend)

```bash
# In .env file
USE_UNIFIED_LLM_CLIENT="false"
```

## Troubleshooting

### "Failed to connect to Ollama"

- Ensure Ollama is running: `ollama serve`
- Check that `LLM_API_BASE_URL` is correct (default: `http://localhost:11434/v1`)

### "Model not found"

- Pull the model first: `ollama pull <model-name>`
- For Gemini models, ensure `GEMINI_API_KEY` is set correctly

### "API key error" (Gemini models)

- Verify your API key at: https://aistudio.google.com/apikey
- Ensure `GEMINI_API_KEY` is set in your `.env` file
- Restart services after updating `.env`

## API Reference

### `processUserMessage(options)`

Main function to process user messages using the unified LLM client.

**Parameters:**
- `userId` (string): User identifier
- `message` (string): User message
- `conversationHistory` (array, optional): Previous conversation messages
- `personalizationContext` (string, optional): Personalization context from learner
- `context` (object, optional): Additional context
- `temperature` (number, optional): Model temperature (default: 0.7)

**Returns:**
- `response` (string): AI response
- `model` (string): Model used
- `timestamp` (string): Response timestamp

### `getModelConfig()`

Get current model configuration.

**Returns:**
- `model` (string): Current model
- `baseUrl` (string): API base URL
- `hasApiKey` (boolean): Whether API key is configured

### `getAvailableModels()`

Get list of available models.

**Returns:**
- Array of model names (string[])

## Next Steps

1. Test the integration by sending a message through the Hub
2. Monitor logs to ensure the unified client is being used
3. Experiment with different models to find the best fit for your use case
4. Adjust `temperature` in the code if you want different response styles

