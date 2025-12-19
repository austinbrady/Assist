import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

// Import port manager - use require for workspace packages
let PortManager: any;
try {
  PortManager = require('@assisant-ai/port-manager');
} catch (error) {
  // Fallback to local path if workspace package not available
  PortManager = require('../../../packages/port-manager/dist/index');
}

const { getPortManager } = PortManager;

// Get the project root directory
// In development (tsx): __dirname is middleware/src/routes -> go up 2 levels
// In production (compiled): __dirname is middleware/dist/routes -> go up 3 levels
// Try both and use the one that has config/ports.json
function getProjectRoot(): string {
  const possibleRoots = [
    path.resolve(__dirname, '../../..'), // Production: middleware/dist/routes -> root
    path.resolve(__dirname, '../..'),   // Development: middleware/src/routes -> root
    process.cwd(),                       // Current working directory
  ];
  
  for (const root of possibleRoots) {
    const configPath = path.join(root, 'config', 'ports.json');
    if (fs.existsSync(configPath)) {
      return root;
    }
  }
  
  // Fallback to process.cwd() if nothing found
  return process.cwd();
}

const PROJECT_ROOT = getProjectRoot();
const CONFIG_PATH = path.join(PROJECT_ROOT, 'config', 'ports.json');

// Log the config path on module load for debugging
logger.info('Port manager config path', { 
  configPath: CONFIG_PATH,
  projectRoot: PROJECT_ROOT,
  exists: fs.existsSync(CONFIG_PATH)
});

export const hubRouter = Router();

// Store running processes
const runningProcesses: Map<string, ChildProcess> = new Map();

/**
 * Get all apps with their port configurations
 * GET /api/hub/apps
 */
hubRouter.get('/apps', async (req: Request, res: Response) => {
  try {
    const portManager = getPortManager(CONFIG_PATH);
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
    const portManager = getPortManager(CONFIG_PATH);
    const app = portManager.getApp(appId);

    if (!app) {
      logger.error(`App not found: ${appId}`, {
        appId,
        availableApps: portManager.getAllApps().map((a: { id: string }) => a.id)
      });
      return res.status(404).json({ error: 'App not found' });
    }

    if (runningProcesses.has(appId)) {
      return res.json({ message: 'App is already running', app });
    }

    // Update status to starting
    portManager.updateAppStatus(appId, 'starting');

    // Start the app process
    // Use path from config if available, otherwise construct from appId
    let appPath: string;
    if (app.path) {
      appPath = path.join(PROJECT_ROOT, app.path);
      } else {
        // Fallback: try to construct path from appId
        // Handle cases like "mvpassistant-frontend" -> "apps/mvpassistant/frontend"
        if (appId.includes('-frontend')) {
          const baseId = appId.replace('-frontend', '');
          appPath = path.join(PROJECT_ROOT, 'apps', baseId, 'frontend');
        } else if (appId.includes('-backend')) {
          const baseId = appId.replace('-backend', '');
          appPath = path.join(PROJECT_ROOT, 'apps', baseId, 'backend');
        } else {
          appPath = path.join(PROJECT_ROOT, 'apps', appId);
        }
      }
    
    // Check if app directory exists
    if (!fs.existsSync(appPath)) {
      logger.error(`App directory not found: ${appPath} for app ${appId}`);
      return res.status(404).json({ error: `App directory not found: ${appPath}` });
    }

    // Determine start command based on app type
    let command: string;
    let args: string[];
    let cwd = appPath;

    // If there's a custom startCommand in config, use it
    if (app.startCommand) {
      // Parse the startCommand (e.g., "cd apps/personalai && ./start.sh")
      const parts = app.startCommand.split('&&').map((s: string) => s.trim());
      if (parts.length > 1) {
        // Handle cd commands
        const cdPart = parts.find((p: string) => p.startsWith('cd '));
        if (cdPart) {
          const cdPath = cdPart.replace('cd ', '').trim();
          cwd = path.join(process.cwd(), cdPath);
        }
        // Use the last part as the actual command
        const actualCommand = parts[parts.length - 1];
        if (actualCommand.startsWith('./')) {
          // Shell script
          command = 'sh';
          args = [actualCommand];
        } else {
          // Try to parse as command
          const cmdParts = actualCommand.split(' ');
          command = cmdParts[0];
          args = cmdParts.slice(1);
        }
      } else {
        // Single command
        const cmdParts = parts[0].split(' ');
        command = cmdParts[0];
        args = cmdParts.slice(1);
      }
    } else if (fs.existsSync(path.join(appPath, 'package.json'))) {
      // Node.js app - use npm start script
      const pkg = JSON.parse(fs.readFileSync(path.join(appPath, 'package.json'), 'utf-8'));
      const startScript = pkg.scripts?.start;
      
      if (startScript) {
        // Use npm run start to respect the package.json script
        command = 'npm';
        args = ['run', 'start'];
      } else if (pkg.scripts?.dev) {
        // Fallback to dev if start doesn't exist
        command = 'npm';
        args = ['run', 'dev'];
      } else {
        return res.status(400).json({ error: 'No start or dev script found in package.json' });
      }
    } else if (fs.existsSync(path.join(appPath, 'requirements.txt'))) {
      // Python app
      command = 'python3';
      args = ['-m', 'uvicorn', 'main:app', '--port', app.port.toString()];
    } else {
      return res.status(400).json({ error: 'Unsupported app type - no package.json or requirements.txt found' });
    }

    // Prepare environment variables
    const envVars: Record<string, string> = {
      ...process.env,
      PORT: app.port.toString(),
    };
    
    // Set app-specific environment variables if needed
    if (appId.includes('mvpassistant-frontend')) {
      envVars.MVP_FRONTEND_PORT = app.port.toString();
    } else if (appId.includes('personalai-frontend')) {
      envVars.PERSONALAI_FRONTEND_PORT = app.port.toString();
    } else if (appId.includes('promptwriter-frontend')) {
      envVars.PROMPTWRITER_FRONTEND_PORT = app.port.toString();
    }

    // Spawn child process (renamed from 'process' to avoid conflict with global)
    const childProcess = spawn(command, args, {
      cwd: cwd,
      stdio: 'pipe',
      shell: app.startCommand ? true : false, // Use shell for custom commands
      env: envVars
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
    const portManager = getPortManager(CONFIG_PATH);

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

    const portManager = getPortManager(CONFIG_PATH);
    const port = await portManager.registerApp(id, name, type, description);

    res.json({ message: 'App registered', app: { id, name, type, port } });

  } catch (error: any) {
    logger.error('Register app error', { error: error.message });
    res.status(500).json({ error: 'Failed to register app' });
  }
});

/**
 * Verify LLM connections (Ollama and Gemini)
 * GET /api/hub/verify/llm
 * Proxies to PersonalAI backend
 */
hubRouter.get('/verify/llm', async (req: Request, res: Response) => {
  try {
    const PERSONAL_AI_BASE_URL = process.env.PERSONAL_AI_BASE_URL || 'http://localhost:4202';
    
    const response = await axios.get(`${PERSONAL_AI_BASE_URL}/api/verify/llm`, {
      timeout: 5000
    });
    
    res.json(response.data);
  } catch (error: any) {
    logger.error('Verify LLM error', { error: error.message });
    
    if (error.response) {
      return res.status(error.response.status).json({
        ollama: {
          connected: false,
          url: 'http://localhost:11434',
          error: error.response.data?.error || 'Failed to check Ollama connection'
        },
        gemini: {
          configured: false,
          api_key_set: false,
          api_key_valid: false,
          error: 'Unable to check'
        },
        timestamp: new Date().toISOString()
      });
    }
    
    res.status(500).json({
      ollama: {
        connected: false,
        url: 'http://localhost:11434',
        error: 'Backend not responding'
      },
      gemini: {
        configured: false,
        api_key_set: false,
        api_key_valid: false,
        error: 'Unable to check'
      },
      timestamp: new Date().toISOString()
    });
  }
});

