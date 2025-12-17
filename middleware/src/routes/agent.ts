import { Router, Request, Response } from 'express';
import axios from 'axios';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';
import { processUserMessage } from '@assisant-ai/agent';

export const agentRouter = Router();

const PERSONAL_AI_BASE_URL = process.env.PERSONAL_AI_BASE_URL || 'http://localhost:4202';
const PROMPT_WRITER_BASE_URL = process.env.PROMPT_WRITER_BASE_URL || 'http://localhost:4206';
// Prompt Writer is ALWAYS enabled - it's a core backend tool that optimizes prompts
// BEFORE sending to main AI to reduce costs and processing power
// This is a foundational component - all prompts go through Prompt Writer first
const USE_PROMPT_WRITER = process.env.USE_PROMPT_WRITER !== 'false'; // Always enabled by default

// Check if unified LLM client should be used
const USE_UNIFIED_CLIENT = process.env.USE_UNIFIED_LLM_CLIENT === 'true' || 
  (process.env.LLM_API_BASE_URL && process.env.LLM_MODEL);

/**
 * Get agent state for user
 * GET /api/agent/state
 */
agentRouter.get('/state', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get agent state from PersonalAI
    const response = await axios.get(
      `${PERSONAL_AI_BASE_URL}/api/agent/state`,
      {
        headers: {
          Authorization: `Bearer ${req.headers['authorization']?.split(' ')[1]}`
        },
        params: { userId }
      }
    );

    res.json(response.data);

  } catch (error: any) {
    logger.error('Get agent state error', { error: error.message });
    res.status(500).json({ error: 'Failed to get agent state' });
  }
});

/**
 * Send message to agent with full conversation history
 * POST /api/agent/message
 * 
 * IMPORTANT: Always includes full conversation history to ensure
 * the agent understands where we are in the conversation.
 * 
 * Also automatically learns from conversations to better understand the user.
 */
agentRouter.post('/message', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { message, context: initialContext, appId, conversationHistory, notes } = req.body;
    
    // Create mutable context object (Prompt Writer may modify it)
    let context = initialContext || {};

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    // Initialize variables before use
    let messageToProcess = message;
    let fullHistory = conversationHistory || [];

    // STEP 1: Rewrite prompt using Prompt Writer (ALWAYS ENABLED - Core Backend Tool)
    // Prompt Writer optimizes prompts BEFORE sending to main AI to reduce costs and processing power
    // This is a foundational component - all prompts go through Prompt Writer first
    let optimizedMessage = messageToProcess;
    let promptWriterNeedsClarification = false;
    
    if (USE_PROMPT_WRITER) {
      try {
        const rewriteResponse = await axios.post(
          `${PROMPT_WRITER_BASE_URL}/api/rewrite-with-clarification`,
          {
            prompt: messageToProcess,
            context: context,
            conversation_history: fullHistory,
            optimization_level: 'balanced',
            notes: notes || undefined
          },
          {
            timeout: 30000, // 30 second timeout (longer for user interaction)
            headers: {
              'Authorization': req.headers['authorization'] || ''
            }
          }
        );
        
        if (rewriteResponse.data) {
          // Check if Prompt Writer needs clarification
          if (rewriteResponse.data.needs_clarification && rewriteResponse.data.clarification_question) {
            promptWriterNeedsClarification = true;
            // Return the formatted clarification question to the user immediately
            const formattedQuestion = rewriteResponse.data.formatted_question || 
              `🤔 **Prompt Writer needs clarification:**\n\n${rewriteResponse.data.clarification_question}\n\nPlease respond with more details so I can better understand your request.`;
            
            return res.json({
              response: formattedQuestion,
              context: {
                ...context,
                source: 'promptwriter',
                type: 'clarification_request',
                original_message: message,
                waiting_for_clarification: true
              },
              timestamp: new Date().toISOString(),
              needsClarification: true
            });
          }
          
          if (rewriteResponse.data.optimized_prompt) {
            optimizedMessage = rewriteResponse.data.optimized_prompt;
            logger.info('Prompt rewritten by Prompt Writer', {
              original_length: message.length,
              optimized_length: optimizedMessage.length,
              improvements: rewriteResponse.data.improvements
            });
          }
        }
      } catch (rewriteError: any) {
        // Fail silently - if prompt writer fails, use original message
        logger.warn('Prompt Writer failed, using original message', {
          error: rewriteError.message
        });
      }
    }

    // Check if this is a response to a Prompt Writer clarification request
    // Look in conversation history for the last clarification request
    let originalMessageForClarification: string | null = null;
    if (conversationHistory && conversationHistory.length > 0) {
      // Find the most recent message with clarification request context
      for (let i = conversationHistory.length - 1; i >= 0; i--) {
        const msg = conversationHistory[i];
        const msgContext = typeof msg === 'object' && 'context' in msg ? msg.context : {};
        if (msgContext?.waiting_for_clarification && msgContext?.original_message) {
          originalMessageForClarification = msgContext.original_message;
          break;
        }
      }
    }
    
    // If we found an original message, this is a clarification response
    // Combine the original message with the clarification
    if (originalMessageForClarification) {
      messageToProcess = `${originalMessageForClarification}\n\nUser clarification: ${message}`;
      // Update context with clarification response info
      context = {
        ...context,
        promptwriter_clarification_response: true,
        original_message: originalMessageForClarification
      };
    }

    // If conversation history wasn't provided, fetch it automatically
    if (!fullHistory || fullHistory.length === 0) {
      try {
        const historyResponse = await axios.get(
          `${PERSONAL_AI_BASE_URL}/api/agent/history`,
          {
            headers: {
              Authorization: `Bearer ${req.headers['authorization']?.split(' ')[1]}`
            },
            params: { userId, limit: 100, offset: 0, appId }
          }
        );
        
        if (historyResponse.data && historyResponse.data.messages) {
          fullHistory = historyResponse.data.messages;
        }
      } catch (historyError: any) {
        logger.warn('Failed to fetch conversation history, continuing without it', {
          error: historyError.message
        });
        // Continue without history if fetch fails
        fullHistory = [];
      }
    }

    // Get personalization context from learner system
    let personalizationContext = '';
    try {
      const personalizationResponse = await axios.get(
        `${PERSONAL_AI_BASE_URL}/api/learner/personalization`,
        {
          headers: {
            Authorization: `Bearer ${req.headers['authorization']?.split(' ')[1]}`
          },
          params: { userId }
        }
      );
      personalizationContext = personalizationResponse.data?.context || '';
    } catch (error) {
      // Fail silently - personalization is nice-to-have
    }

    // Use unified LLM client if configured, otherwise route through PersonalAI backend
    if (USE_UNIFIED_CLIENT) {
      try {
        // Use the unified Ollama & Gemini client with optimized message
        const llmResponse = await processUserMessage({
          userId,
          message: optimizedMessage, // Use optimized message from Prompt Writer
          conversationHistory: fullHistory,
          personalizationContext,
          context: {
            ...context,
            appId,
            original_message: message, // Keep original for reference
            was_optimized: optimizedMessage !== message
          }
        });

        // Return response in the expected format
        res.json({
          response: llmResponse.response,
          context: {
            ...context,
            model: llmResponse.model,
            appId
          },
          timestamp: llmResponse.timestamp
        });
        return;
      } catch (unifiedError: any) {
        logger.warn('Unified LLM client failed, falling back to PersonalAI backend', {
          error: unifiedError.message
        });
        // Fall through to PersonalAI backend
      }
    }

    // Fallback: Forward to PersonalAI agent with full conversation history and personalization
    // Use optimized message from Prompt Writer
    const response = await axios.post(
      `${PERSONAL_AI_BASE_URL}/api/agent/message`,
      {
        userId,
        message: optimizedMessage, // Use optimized message from Prompt Writer
        context: {
          ...context,
          personalization: personalizationContext,
          original_message: message, // Keep original for reference
          was_optimized: optimizedMessage !== message
        },
        appId, // Track which app the message came from
        conversationHistory: fullHistory, // Always include full history
        timestamp: new Date().toISOString()
      },
      {
        headers: {
          Authorization: `Bearer ${req.headers['authorization']?.split(' ')[1]}`
        }
      }
    );

    // Learn from this conversation (async, non-blocking)
    if (response.data && response.data.response) {
      // Don't await - let learning happen in background
      axios.post(
        `${PERSONAL_AI_BASE_URL}/api/learner/learn`,
        {
          userId,
          message,
          response: response.data.response,
          context: {
            appId,
            timestamp: new Date().toISOString()
          }
        },
        {
          headers: {
            Authorization: `Bearer ${req.headers['authorization']?.split(' ')[1]}`
          }
        }
      ).catch(() => {
        // Fail silently - learning shouldn't break conversations
      });
    }

    res.json(response.data);

  } catch (error: any) {
    logger.error('Agent message error', { error: error.message });
    res.status(500).json({ error: 'Failed to process message' });
  }
});

/**
 * Get conversation history
 * GET /api/agent/history
 */
agentRouter.get('/history', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { limit = 50, offset = 0, appId } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get history from PersonalAI
    const response = await axios.get(
      `${PERSONAL_AI_BASE_URL}/api/agent/history`,
      {
        headers: {
          Authorization: `Bearer ${req.headers['authorization']?.split(' ')[1]}`
        },
        params: { userId, limit, offset, appId }
      }
    );

    res.json(response.data);

  } catch (error: any) {
    logger.error('Get history error', { error: error.message });
    res.status(500).json({ error: 'Failed to get conversation history' });
  }
});

/**
 * Update agent preferences
 * PUT /api/agent/preferences
 */
agentRouter.put('/preferences', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const preferences = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Update preferences in PersonalAI
    const response = await axios.put(
      `${PERSONAL_AI_BASE_URL}/api/agent/preferences`,
      { userId, preferences },
      {
        headers: {
          Authorization: `Bearer ${req.headers['authorization']?.split(' ')[1]}`
        }
      }
    );

    res.json(response.data);

  } catch (error: any) {
    logger.error('Update preferences error', { error: error.message });
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

