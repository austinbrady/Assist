import { Router, Request, Response } from 'express';
import axios from 'axios';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

export const learnerRouter = Router();

const PERSONAL_AI_BASE_URL = process.env.PERSONAL_AI_BASE_URL || 'http://localhost:4202';

/**
 * Learn from conversation
 * POST /api/learner/learn
 * 
 * This endpoint extracts insights from conversations naturally.
 * It's called automatically by the agent system.
 */
learnerRouter.post('/learn', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { message, response, context } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Forward to PersonalAI learner system
    const aiResponse = await axios.post(
      `${PERSONAL_AI_BASE_URL}/api/learner/learn`,
      {
        userId,
        message,
        response,
        context: {
          ...context,
          timestamp: context?.timestamp || new Date().toISOString()
        }
      },
      {
        headers: {
          Authorization: `Bearer ${req.headers['authorization']?.split(' ')[1]}`
        }
      }
    );

    res.json(aiResponse.data);

  } catch (error: any) {
    // Fail silently - learning shouldn't break conversations
    logger.warn('Learning error (non-critical)', { error: error.message });
    res.json({ success: false, message: 'Learning failed silently' });
  }
});

/**
 * Get user insights
 * GET /api/learner/insights
 */
learnerRouter.get('/insights', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { category } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get insights from PersonalAI
    const response = await axios.get(
      `${PERSONAL_AI_BASE_URL}/api/learner/insights`,
      {
        headers: {
          Authorization: `Bearer ${req.headers['authorization']?.split(' ')[1]}`
        },
        params: { userId, category }
      }
    );

    res.json(response.data);

  } catch (error: any) {
    logger.error('Get insights error', { error: error.message });
    res.status(500).json({ error: 'Failed to get insights' });
  }
});

/**
 * Get personalization context for agent
 * GET /api/learner/personalization
 */
learnerRouter.get('/personalization', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get personalization context from PersonalAI
    const response = await axios.get(
      `${PERSONAL_AI_BASE_URL}/api/learner/personalization`,
      {
        headers: {
          Authorization: `Bearer ${req.headers['authorization']?.split(' ')[1]}`
        },
        params: { userId }
      }
    );

    res.json({ context: response.data });

  } catch (error: any) {
    logger.error('Get personalization error', { error: error.message });
    // Return empty context if learning system fails
    res.json({ context: '' });
  }
});

