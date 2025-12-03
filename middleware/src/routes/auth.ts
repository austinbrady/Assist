import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { logger } from '../utils/logger';

export const authRouter = Router();

// PersonalAI base URL - configure this in .env
const PERSONAL_AI_BASE_URL = process.env.PERSONAL_AI_BASE_URL || 'http://localhost:4202';

/**
 * Login endpoint - proxies to PersonalAI
 * POST /api/auth/login
 */
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Forward to PersonalAI authentication
    const response = await axios.post(`${PERSONAL_AI_BASE_URL}/api/auth/login`, {
      email,
      password
    });

    // Return token and user info
    res.json({
      token: response.data.token,
      user: response.data.user,
      expiresIn: response.data.expiresIn
    });

  } catch (error: any) {
    logger.error('Login error', { error: error.message });
    
    if (error.response) {
      return res.status(error.response.status).json({
        error: error.response.data?.error || 'Authentication failed'
      });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Register endpoint - proxies to PersonalAI
 * POST /api/auth/register
 */
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Forward to PersonalAI registration
    const response = await axios.post(`${PERSONAL_AI_BASE_URL}/api/auth/register`, {
      email,
      password,
      name
    });

    res.json({
      token: response.data.token,
      user: response.data.user,
      message: 'Registration successful'
    });

  } catch (error: any) {
    logger.error('Registration error', { error: error.message });
    
    if (error.response) {
      return res.status(error.response.status).json({
        error: error.response.data?.error || 'Registration failed'
      });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Refresh token endpoint
 * POST /api/auth/refresh
 */
authRouter.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Forward to PersonalAI
    const response = await axios.post(`${PERSONAL_AI_BASE_URL}/api/auth/refresh`, {
      refreshToken
    });

    res.json({
      token: response.data.token,
      expiresIn: response.data.expiresIn
    });

  } catch (error: any) {
    logger.error('Token refresh error', { error: error.message });
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

/**
 * Logout endpoint
 * POST /api/auth/logout
 */
authRouter.post('/logout', async (req: Request, res: Response) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (token) {
      // Forward logout to PersonalAI to invalidate session
      await axios.post(
        `${PERSONAL_AI_BASE_URL}/api/auth/logout`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }

    res.json({ message: 'Logged out successfully' });

  } catch (error: any) {
    logger.error('Logout error', { error: error.message });
    // Still return success even if PersonalAI logout fails
    res.json({ message: 'Logged out successfully' });
  }
});

/**
 * Verify token endpoint
 * GET /api/auth/verify
 */
authRouter.get('/verify', async (req: Request, res: Response) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token required' });
    }

    // Verify with PersonalAI
    const response = await axios.get(
      `${PERSONAL_AI_BASE_URL}/api/auth/verify`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    res.json({ valid: true, user: response.data.user });

  } catch (error: any) {
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
});

