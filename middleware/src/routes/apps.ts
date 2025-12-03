import { Router, Request, Response } from 'express';
import axios from 'axios';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';
import { getAppConfig } from '../config/apps';

export const appRouter = Router();

/**
 * Get list of connected apps
 * GET /api/apps
 */
appRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const apps = getAppConfig();
    res.json({ apps });

  } catch (error: any) {
    logger.error('Get apps error', { error: error.message });
    res.status(500).json({ error: 'Failed to get apps' });
  }
});

/**
 * Proxy request to specific app
 * POST /api/apps/:appId/proxy
 */
appRouter.post('/:appId/proxy', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { appId } = req.params;
    const { endpoint, method = 'GET', data } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const apps = getAppConfig();
    const app = apps.find(a => a.id === appId);

    if (!app) {
      return res.status(404).json({ error: 'App not found' });
    }

    // Proxy request to the app with authentication
    const response = await axios({
      method: method.toLowerCase(),
      url: `${app.baseUrl}${endpoint}`,
      data,
      headers: {
        'Authorization': `Bearer ${req.headers['authorization']?.split(' ')[1]}`,
        'X-User-Id': userId,
        'Content-Type': 'application/json'
      }
    });

    res.json(response.data);

  } catch (error: any) {
    logger.error('App proxy error', { error: error.message });
    
    if (error.response) {
      return res.status(error.response.status).json({
        error: error.response.data?.error || 'Proxy request failed'
      });
    }

    res.status(500).json({ error: 'Failed to proxy request' });
  }
});

