import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

/**
 * Middleware to authenticate JWT tokens
 * Uses PersonalAI authentication system as base
 */
export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Authentication token required' });
    return;
  }

  const secret = process.env.JWT_SECRET || 'your-secret-key';
  
  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      logger.warn('Invalid token', { error: err.message, ip: req.ip });
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }

    // Attach user info to request
    if (decoded && typeof decoded === 'object') {
      req.userId = decoded.userId || decoded.sub;
      req.userEmail = decoded.email;
    }

    next();
  });
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    jwt.verify(token, secret, (err, decoded) => {
      if (!err && decoded && typeof decoded === 'object') {
        req.userId = decoded.userId || decoded.sub;
        req.userEmail = decoded.email;
      }
    });
  }

  next();
};

