import { Router, Request, Response } from 'express';
import axios from 'axios';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

export const userRouter = Router();

const PERSONAL_AI_BASE_URL = process.env.PERSONAL_AI_BASE_URL || 'http://localhost:4202';

/**
 * Get current user profile
 * GET /api/user/profile
 */
userRouter.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get user profile from PersonalAI
    const response = await axios.get(
      `${PERSONAL_AI_BASE_URL}/api/user/profile`,
      {
        headers: {
          Authorization: `Bearer ${req.headers['authorization']?.split(' ')[1]}`
        },
        params: { userId }
      }
    );

    res.json(response.data);

  } catch (error: any) {
    logger.error('Get user profile error', { error: error.message });
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

/**
 * Update user profile
 * PUT /api/user/profile
 */
userRouter.put('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const updates = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Update profile in PersonalAI
    const response = await axios.put(
      `${PERSONAL_AI_BASE_URL}/api/user/profile`,
      { userId, ...updates },
      {
        headers: {
          Authorization: `Bearer ${req.headers['authorization']?.split(' ')[1]}`
        }
      }
    );

    res.json(response.data);

  } catch (error: any) {
    logger.error('Update user profile error', { error: error.message });
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

/**
 * Get user data across all apps
 * GET /api/user/data
 */
userRouter.get('/data', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get unified user data from PersonalAI
    const response = await axios.get(
      `${PERSONAL_AI_BASE_URL}/api/user/data`,
      {
        headers: {
          Authorization: `Bearer ${req.headers['authorization']?.split(' ')[1]}`
        },
        params: { userId }
      }
    );

    res.json(response.data);

  } catch (error: any) {
    logger.error('Get user data error', { error: error.message });
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

