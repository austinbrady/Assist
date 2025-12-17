# @assisant-ai/agent

Shared agent infrastructure package with RAG and structured output capabilities.

## Features

- **RAG (Retrieval-Augmented Generation)**: Uses ChromaDB for local vector storage and retrieval
- **Structured Output**: Zod schemas ensure reliable JSON extraction for the learning system
- **LangChain Integration**: Orchestrates complex agent workflows
- **Unified LLM Support**: Works with both local Ollama models and cloud Gemini models

## Installation

```bash
npm install
npm run build
```

## Dependencies

- `langchain`: Core agent framework
- `@langchain/community`: Community integrations (Ollama, ChromaDB)
- `zod`: Schema validation for structured output
- `chromadb`: Local vector database for RAG

## Usage

### Basic Usage

```typescript
import { processUserMessage } from '@assisant-ai/agent';

const response = await processUserMessage({
  userId: 'user123',
  message: 'Hello!',
  conversationHistory: [],
  personalizationContext: '',
});
```

### Initialize RAG

```typescript
import { initializeRAG } from '@assisant-ai/agent';

// Call this on application startup
await initializeRAG();
```

### Get Model Configuration

```typescript
import { getModelConfig, getAvailableModels } from '@assisant-ai/agent';

const config = getModelConfig();
const models = getAvailableModels();
```

## Configuration

Set in `.env`:

```bash
# LLM Configuration
LLM_MODEL=llama3  # or gemini-2.5-flash
LLM_API_BASE_URL=http://localhost:11434/v1
OLLAMA_BASE_URL=http://localhost:11434
GEMINI_API_KEY=your_key_here  # For Gemini models

# RAG Configuration (optional)
# ChromaDB should be running on http://localhost:8000
```

## RAG Setup

1. Install ChromaDB:
   ```bash
   pip install chromadb
   ```

2. Start ChromaDB server:
   ```bash
   chroma run --path ./chroma_db
   ```

3. Pull embedding model:
   ```bash
   ollama pull nomic-embed-text
   ```

## Structured Output

The agent uses Zod schemas to ensure reliable JSON extraction for the learning system. Insights are automatically extracted and stored with proper validation.

## Development

```bash
npm run dev  # Watch mode
npm run build  # Build
```

