import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';

// Import port manager - use require for workspace packages
let PortManager: any;
try {
  PortManager = require('@assisant-ai/port-manager');
} catch (error) {
  // Fallback to local path if workspace package not available
  PortManager = require('../../../packages/port-manager/dist/index');
}

const { getPortManager } = PortManager;

export const hubRouter = Router();

// Store running processes
const runningProcesses: Map<string, ChildProcess> = new Map();

/**
 * Get all apps with their port configurations
 * GET /api/hub/apps
 */
hubRouter.get('/apps', async (req: Request, res: Response) => {
  try {
    const portManager = getPortManager();
    const apps = portManager.getAllApps();
    
    // Check which apps are actually running
    const appsWithStatus = apps.map((app: any) => {
      const isRunning = runningProcesses.has(app.id);
      return {
        ...app,
        status: isRunning ? 'running' : 'stopped',
        url: isRunning ? `http://localhost:${app.port}` : undefined
      };
    });

    res.json({ apps: appsWithStatus });

  } catch (error: any) {
    logger.error('Get apps error', { error: error.message });
    res.status(500).json({ error: 'Failed to get apps' });
  }
});

/**
 * Start an app
 * POST /api/hub/apps/:appId/start
 */
hubRouter.post('/apps/:appId/start', async (req: AuthRequest, res: Response) => {
  try {
    const { appId } = req.params;
    const portManager = getPortManager();
    const app = portManager.getApp(appId);

    if (!app) {
      return res.status(404).json({ error: 'App not found' });
    }

    if (runningProcesses.has(appId)) {
      return res.json({ message: 'App is already running', app });
    }

    // Update status to starting
    portManager.updateAppStatus(appId, 'starting');

    // Start the app process
    const appPath = path.join(process.cwd(), 'apps', appId);
    
    // Check if app directory exists
    if (!fs.existsSync(appPath)) {
      return res.status(404).json({ error: 'App directory not found' });
    }

    // Determine start command based on app type
    let command: string;
    let args: string[];

    if (fs.existsSync(path.join(appPath, 'package.json'))) {
      // Node.js app
      const pkg = JSON.parse(fs.readFileSync(path.join(appPath, 'package.json'), 'utf-8'));
      const startScript = pkg.scripts?.start || pkg.scripts?.dev || 'node index.js';
      
      if (startScript.includes('next')) {
        command = 'npx';
        args = ['next', 'start', '-p', app.port.toString()];
      } else if (startScript.includes('node')) {
        command = 'node';
        args = startScript.replace('node ', '').split(' ');
      } else {
        command = 'npm';
        args = ['run', 'start'];
      }
    } else if (fs.existsSync(path.join(appPath, 'requirements.txt'))) {
      // Python app
      command = 'python3';
      args = ['-m', 'uvicorn', 'main:app', '--port', app.port.toString()];
    } else {
      return res.status(400).json({ error: 'Unsupported app type' });
    }

    // Spawn child process (renamed from 'process' to avoid conflict with global)
    const childProcess = spawn(command, args, {
      cwd: appPath,
      stdio: 'pipe',
      env: {
        ...process.env,
        PORT: app.port.toString(),
      }
    });

    // Store process
    runningProcesses.set(appId, childProcess);

    // Handle process events
    childProcess.on('exit', (code: number | null) => {
      runningProcesses.delete(appId);
      portManager.updateAppStatus(appId, 'stopped');
      logger.info(`App ${appId} exited with code ${code}`);
    });

    childProcess.stderr?.on('data', (data: Buffer) => {
      logger.error(`App ${appId} error:`, { error: data.toString() });
    });

    // Wait a bit to see if child process starts successfully
    setTimeout(() => {
      if (childProcess.killed || childProcess.exitCode !== null) {
        portManager.updateAppStatus(appId, 'stopped');
        runningProcesses.delete(appId);
      } else {
        portManager.updateAppStatus(appId, 'running');
      }
    }, 2000);

    res.json({ message: 'App starting', app });

  } catch (error: any) {
    logger.error('Start app error', { error: error.message });
    res.status(500).json({ error: 'Failed to start app' });
  }
});

/**
 * Stop an app
 * POST /api/hub/apps/:appId/stop
 */
hubRouter.post('/apps/:appId/stop', async (req: AuthRequest, res: Response) => {
  try {
    const { appId } = req.params;
    const portManager = getPortManager();

    const childProcess = runningProcesses.get(appId);
    if (!childProcess) {
      return res.json({ message: 'App is not running' });
    }

    // Kill the process
    childProcess.kill();
    runningProcesses.delete(appId);
    portManager.updateAppStatus(appId, 'stopped');

    res.json({ message: 'App stopped' });

  } catch (error: any) {
    logger.error('Stop app error', { error: error.message });
    res.status(500).json({ error: 'Failed to stop app' });
  }
});

/**
 * Register a new app
 * POST /api/hub/apps/register
 */
hubRouter.post('/apps/register', async (req: AuthRequest, res: Response) => {
  try {
    const { id, name, type, description } = req.body;

    if (!id || !name || !type) {
      return res.status(400).json({ error: 'id, name, and type are required' });
    }

    const portManager = getPortManager();
    const port = await portManager.registerApp(id, name, type, description);

    res.json({ message: 'App registered', app: { id, name, type, port } });

  } catch (error: any) {
    logger.error('Register app error', { error: error.message });
    res.status(500).json({ error: 'Failed to register app' });
  }
});

