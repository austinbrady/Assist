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
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Forward to PersonalAI authentication
    const response = await axios.post(`${PERSONAL_AI_BASE_URL}/api/auth/login`, {
      username,
      password
    });

    // Return token and user info in standardized format
    res.json({
      token: response.data.token,
      user: {
        username: response.data.username,
        assistant: response.data.assistant,
        onboarding_complete: response.data.onboarding_complete
      },
      expiresIn: '30d'
    });

  } catch (error: any) {
    logger.error('Login error', { error: error.message });
    
    if (error.response) {
      return res.status(error.response.status).json({
        error: error.response.data?.detail || error.response.data?.error || 'Authentication failed'
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
    const { username, password, gender } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Forward to PersonalAI registration
    const response = await axios.post(`${PERSONAL_AI_BASE_URL}/api/auth/signup`, {
      username,
      password,
      gender: gender || null
    });

    res.json({
      token: response.data.token,
      user: {
        username: response.data.username,
        assistant: response.data.assistant,
        onboarding_complete: response.data.onboarding_complete || false
      },
      message: 'Registration successful'
    });

  } catch (error: any) {
    logger.error('Registration error', { error: error.message, response: error.response?.data });
    
    if (error.response) {
      // Handle FastAPI validation errors (422)
      const status = error.response.status;
      const errorData = error.response.data;
      
      // FastAPI returns validation errors as an array in the detail field
      if (status === 422 && Array.isArray(errorData?.detail)) {
        const validationErrors = errorData.detail.map((err: any) => {
          const field = Array.isArray(err.loc) ? err.loc[err.loc.length - 1] : 'field';
          return `${field}: ${err.msg || 'validation error'}`;
        }).join('. ');
        
        return res.status(422).json({
          error: validationErrors,
          detail: errorData.detail
        });
      }
      
      // Handle other error formats
      const errorMessage = errorData?.detail || errorData?.error || 'Registration failed';
      return res.status(status).json({
        error: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage),
        detail: errorData?.detail
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

    // Verify with PersonalAI by calling /api/auth/me
    const response = await axios.get(
      `${PERSONAL_AI_BASE_URL}/api/auth/me`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    res.json({ 
      valid: true, 
      user: {
        username: response.data.username,
        assistant: response.data.assistant,
        onboarding_complete: response.data.onboarding_complete,
        profile: response.data.profile
      }
    });

  } catch (error: any) {
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
});

/**
 * Get current user endpoint - proxies to PersonalAI
 * GET /api/auth/me
 */
authRouter.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token required' });
    }

    // Forward to PersonalAI
    const response = await axios.get(
      `${PERSONAL_AI_BASE_URL}/api/auth/me`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Return standardized user object
    res.json({
      username: response.data.username,
      assistant: response.data.assistant,
      onboarding_complete: response.data.onboarding_complete || false,
      profile: response.data.profile || null
    });

  } catch (error: any) {
    logger.error('Get current user error', { error: error.message });
    
    if (error.response) {
      return res.status(error.response.status).json({
        error: error.response.data?.detail || 'Failed to get user info'
      });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

