import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth';
import { agentRouter } from './routes/agent';
import { userRouter } from './routes/user';
import { appRouter } from './routes/apps';
import { hubRouter } from './routes/hub';
import { learnerRouter } from './routes/learner';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 4199;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes
app.use('/api/auth', authRouter);

// Protected routes (require authentication)
app.use('/api/agent', authenticateToken, agentRouter);
app.use('/api/user', authenticateToken, userRouter);
app.use('/api/apps', authenticateToken, appRouter);
app.use('/api/learner', authenticateToken, learnerRouter);

// Hub routes (public for now, can add auth if needed)
app.use('/api/hub', hubRouter);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Middleware server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;

