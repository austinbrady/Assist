/**
 * Unified Ollama & Gemini Integration with RAG and Structured Output
 * 
 * This module provides a unified interface to interact with both local Ollama models
 * (like llama3) and cloud Gemini models (like gemini-2.5-flash) through LangChain
 * and Ollama's ChatOllama interface.
 * 
 * Features:
 * - RAG (Retrieval-Augmented Generation) using ChromaDB for local embeddings
 * - Structured output parsing using Zod schemas for reliable JSON extraction
 * - LangChain orchestration for complex agent workflows
 * 
 * Configuration:
 * - GEMINI_API_KEY: Your Google AI Studio API Key (Ollama uses this for Gemini access)
 * - LLM_API_BASE_URL: The unified API endpoint (default: http://localhost:11434/v1)
 * - LLM_MODEL: Model selection (e.g., 'gemini-2.5-flash' or 'llama3')
 */

import { Learner } from '@assisant-ai/learner';
import { InsightSchema, InsightsArraySchema, type Insight } from './schemas';

// LangChain imports
import { ChatOllama } from '@langchain/ollama';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence, Runnable } from '@langchain/core/runnables';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { OllamaEmbeddings } from '@langchain/ollama';
import { Document } from '@langchain/core/documents';

// --- Configuration Setup ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const LLM_API_BASE_URL = process.env.LLM_API_BASE_URL || "http://localhost:11434/v1";
const SELECTED_MODEL = process.env.LLM_MODEL || "llama3"; // Default to local model

// Initialize ChromaDB vector store for RAG
let vectorStore: Chroma | null = null;
let isVectorStoreInitialized = false;

/**
 * Initialize the RAG vector store with ChromaDB
 * This stores embeddings of user data and conversation history for retrieval
 */
async function initializeVectorStore(): Promise<Chroma | null> {
  if (isVectorStoreInitialized) {
    return vectorStore;
  }

  try {
    const embeddings = new OllamaEmbeddings({
      baseUrl: OLLAMA_BASE_URL.replace('/v1', ''), // Remove /v1 for embeddings
      model: "nomic-embed-text", // Good embedding model for Ollama
    });

    // Try to connect to existing collection or create new one
    try {
      vectorStore = await Chroma.fromExistingCollection(embeddings, {
        collectionName: "assisant_ai_rag",
        url: "http://localhost:8000", // ChromaDB default port
      });
    } catch (error) {
      // If collection doesn't exist, create a new one with empty documents
      console.log('[RAG] Creating new vector store collection');
      vectorStore = await Chroma.fromDocuments([], embeddings, {
        collectionName: "assisant_ai_rag",
        url: "http://localhost:8000",
      });
    }

    isVectorStoreInitialized = true;
    console.log('[RAG] Vector store initialized');
    return vectorStore;
  } catch (error) {
    console.warn('[RAG] Failed to initialize vector store (ChromaDB may not be running), continuing without RAG:', error);
    // Create in-memory fallback or continue without RAG
    isVectorStoreInitialized = true; // Prevent retry loops
    return null;
  }
}

/**
 * Create the LangChain ChatOllama client
 */
const llm = new ChatOllama({
  baseUrl: OLLAMA_BASE_URL.replace('/v1', ''), // Remove /v1 for ChatOllama
  model: SELECTED_MODEL,
  temperature: 0.7,
});

/**
 * Define the main conversation chain with RAG
 */
async function createConversationChain(
  personalizationContext: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  message: string
): Promise<Runnable> {
  let ragContext = '';

  // Try to retrieve relevant context from vector store
  try {
    const vectorStore = await initializeVectorStore();
    if (vectorStore) {
      // Combine message with recent conversation for better retrieval
      const searchQuery = `${message} ${conversationHistory.slice(-3).map(m => m.content).join(' ')}`;
      const docs = await vectorStore.similaritySearch(searchQuery, 3);
      
      if (docs.length > 0) {
        ragContext = `\n\nRELEVANT CONTEXT FROM MEMORY:\n${docs.map(d => d.pageContent).join('\n\n')}\n`;
      }
    }
  } catch (error) {
    // Fail silently - RAG is optional
    console.warn('[RAG] Retrieval failed:', error);
  }

  // Format conversation history
  const historyText = conversationHistory
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n');

  // Create a dynamic prompt template that includes RAG context
  const dynamicPrompt = PromptTemplate.fromTemplate(`
You are a helpful AssisantAI agent. Your core model is {model}.

PERSONALIZATION CONTEXT:
---
{personalizationContext}
---

{ragContext}

Use the PERSONALIZATION CONTEXT, RAG CONTEXT (if provided), and your general knowledge to answer the user's message.
Keep your response concise, helpful, and personalized based on the context provided.

CONVERSATION HISTORY:
{conversationHistory}

USER MESSAGE: {message}

AGENT RESPONSE:
`);

  return dynamicPrompt.pipe(llm).pipe(new StringOutputParser());
}

/**
 * Define the Structured Output Parser for learning system
 * Using manual JSON parsing to avoid TypeScript type depth issues with StructuredOutputParser
 */
const getFormatInstructions = () => {
  return `Return a JSON array of insights. Each insight should have:
- category: one of "preference", "interest", "goal", "pattern", "context", "skill"
- key: a short snake_case identifier
- value: the specific learned value
- confidence: a number between 0.0 and 1.0

Example: [{"category": "preference", "key": "design_style", "value": "minimalist", "confidence": 0.9}]`;
};

const parseInsights = (text: string): Insight[] => {
  try {
    // Try to extract JSON from the text (might be wrapped in markdown code blocks)
    let jsonText = text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    const parsed = JSON.parse(jsonText);
    if (Array.isArray(parsed)) {
      return parsed as Insight[];
    }
    return [];
  } catch {
    return [];
  }
};

/**
 * Define the Learning Extraction Chain (runs in background)
 */
async function createExtractionChain() {
  const formatInstructions = getFormatInstructions();
  
  const extractionPrompt = PromptTemplate.fromTemplate(`
Analyze the following conversation and extract all valid, distinct insights based on the provided categories (preference, interest, goal, pattern, context, skill).

Guidelines:
- Extract only clear, confident insights (confidence >= 0.6)
- Avoid extracting ambiguous or uncertain information
- Each insight should have a clear category, key, and value
- If no relevant insights are found, return an empty array: []

CONVERSATION:
User: {userMessage}
Agent: {agentResponse}

SCHEMA FORMAT:
${formatInstructions}

Return ONLY valid JSON array conforming to the schema. No other text.
`);

  const chain = extractionPrompt
    .pipe(llm)
    .pipe(new StringOutputParser());
  
  return {
    invoke: async (params: { userMessage: string; agentResponse: string }) => {
      const output = await chain.invoke(params);
      return parseInsights(output);
    }
  };
}

export interface ProcessMessageOptions {
  userId: string;
  message: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
  }>;
  personalizationContext?: string;
  context?: Record<string, any>;
  temperature?: number;
}

export interface ProcessMessageResponse {
  response: string;
  model: string;
  timestamp: string;
  insights?: Insight[];
}

/**
 * Main function to process user messages using LangChain with RAG
 * 
 * @param options - Message processing options
 * @returns The AI response with metadata
 */
export async function processUserMessage(
  options: ProcessMessageOptions
): Promise<ProcessMessageResponse> {
  const {
    userId,
    message,
    conversationHistory = [],
    personalizationContext = '',
    context = {},
    temperature = 0.7
  } = options;

  // Initialize learner for background learning
  const learner = new Learner(
    process.env.MIDDLEWARE_URL || 'http://localhost:4199'
  );

  // Get personalization context if not provided
  let finalPersonalizationContext = personalizationContext;
  if (!finalPersonalizationContext) {
    try {
      finalPersonalizationContext = await learner.getPersonalizationContext();
    } catch (error) {
      // Fail silently - personalization is nice-to-have
      console.warn('Failed to get personalization context:', error);
    }
  }

  try {
    // Create and run the conversation chain with RAG
    const conversationChain = await createConversationChain(
      finalPersonalizationContext,
      conversationHistory,
      message
    );

    // Format conversation history for the prompt
    const historyText = conversationHistory
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    // Get RAG context
    let ragContext = '';
    try {
      const vectorStore = await initializeVectorStore();
      if (vectorStore) {
        const searchQuery = `${message} ${conversationHistory.slice(-3).map(m => m.content).join(' ')}`;
        const docs = await vectorStore.similaritySearch(searchQuery, 3);
        if (docs.length > 0) {
          ragContext = `\n\nRELEVANT CONTEXT FROM MEMORY:\n${docs.map(d => d.pageContent).join('\n\n')}\n`;
        }
      }
    } catch (error) {
      // Fail silently - RAG is optional
    }

    const agentResponse = await conversationChain.invoke({
      model: SELECTED_MODEL,
      personalizationContext: finalPersonalizationContext || 'No personalization context available.',
      ragContext: ragContext || '',
      conversationHistory: historyText || 'No previous conversation.',
      message: message,
    });

    // Trigger structured learning extraction in the background
    let extractedInsights: Insight[] = [];
    
    const extractionChain = await createExtractionChain();
    
    createExtractionChain()
      .then((chain) => chain.invoke({
        userMessage: message,
        agentResponse: agentResponse,
      }))
      .then((insights: Insight[]) => {
        extractedInsights = insights;
        
        if (insights.length > 0) {
          console.log(`[Learner] Extracted ${insights.length} structured insights for user ${userId}`);
          
          // Store insights in the learner system
          // Convert to the format expected by learner
          insights.forEach((insight: Insight) => {
            learner.learnFromConversation(
              message,
              agentResponse,
              {
                ...context,
                conversationId: context?.conversationId,
                appId: context?.appId,
                timestamp: new Date().toISOString()
              }
            ).catch((error) => {
              console.warn('Failed to store insight:', error);
            });
          });
        }
      })
      .catch((error) => {
        console.error("Structured Extraction Error:", error);
      });

    // Store conversation in vector store for future RAG retrieval
    try {
      const vectorStore = await initializeVectorStore();
      if (vectorStore) {
        const documents = [
          new Document({
            pageContent: `User: ${message}\nAssistant: ${agentResponse}`,
            metadata: {
              userId,
              timestamp: new Date().toISOString(),
              ...context,
            },
          }),
        ];
        
        await vectorStore.addDocuments(documents);
      }
    } catch (error) {
      // Fail silently - RAG storage is optional
      console.warn('[RAG] Failed to store conversation:', error);
    }

    return {
      response: agentResponse,
      model: SELECTED_MODEL,
      timestamp: new Date().toISOString(),
      insights: extractedInsights,
    };
  } catch (error) {
    console.error("LLM Generation Error:", error);
    return {
      response: "I'm currently unable to process your request. Please check your Ollama and LLM configuration.",
      model: SELECTED_MODEL,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Get the current model configuration
 */
export function getModelConfig() {
  return {
    model: SELECTED_MODEL,
    baseUrl: OLLAMA_BASE_URL,
    llmApiBaseUrl: LLM_API_BASE_URL,
    hasApiKey: !!GEMINI_API_KEY,
    ragEnabled: isVectorStoreInitialized,
  };
}

/**
 * Get available models
 */
export function getAvailableModels(): string[] {
  return [
    'gemini-2.5-flash', // Cloud model via Ollama
    'llama3', // Local model
    'llama3.2', // Local model
    'llama3.1', // Local model
  ];
}

/**
 * Initialize RAG system (call this on startup)
 */
export async function initializeRAG(): Promise<void> {
  try {
    await initializeVectorStore();
    console.log('[RAG] RAG system initialized successfully');
  } catch (error) {
    console.warn('[RAG] RAG initialization failed, continuing without RAG:', error);
  }
}
