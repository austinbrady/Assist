import { Router, Request, Response } from 'express';
import axios from 'axios';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

export const agentRouter = Router();

const PERSONAL_AI_BASE_URL = process.env.PERSONAL_AI_BASE_URL || 'http://localhost:4202';

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
    const { message, context, appId, conversationHistory } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    // If conversation history wasn't provided, fetch it automatically
    let fullHistory = conversationHistory;
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

    // Forward to PersonalAI agent with full conversation history and personalization
    const response = await axios.post(
      `${PERSONAL_AI_BASE_URL}/api/agent/message`,
      {
        userId,
        message,
        context: {
          ...context,
          personalization: personalizationContext
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

