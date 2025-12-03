import fs from 'fs';
import path from 'path';
import detectPort from 'detect-port';

export interface AppPortConfig {
  id: string;
  name: string;
  port: number;
  description?: string;
  enabled: boolean;
  type: 'backend' | 'frontend' | 'middleware';
  status?: 'running' | 'stopped' | 'starting';
  url?: string;
}

export interface PortConfig {
  basePort: number;
  apps: AppPortConfig[];
}

export class PortManager {
  private configPath: string;
  private config: PortConfig;

  constructor(configPath?: string) {
    this.configPath = configPath || path.join(process.cwd(), 'config', 'ports.json');
    this.config = this.loadConfig();
  }

  /**
   * Load port configuration from file
   */
  private loadConfig(): PortConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading port config:', error);
    }

    // Default config
    return {
      basePort: 4200,
      apps: []
    };
  }

  /**
   * Save port configuration to file
   */
  private saveConfig(): void {
    try {
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Error saving port config:', error);
      throw error;
    }
  }

  /**
   * Get next available port starting from basePort
   */
  async getNextAvailablePort(startPort?: number): Promise<number> {
    const basePort = startPort || this.config.basePort;
    const usedPorts = this.config.apps
      .filter(app => app.enabled)
      .map(app => app.port);

    let port = basePort;
    while (usedPorts.includes(port)) {
      port++;
    }

    // Check if port is actually available
    const availablePort = await detectPort(port);
    return availablePort;
  }

  /**
   * Register a new app and assign it a port
   */
  async registerApp(
    id: string,
    name: string,
    type: 'backend' | 'frontend' | 'middleware',
    description?: string
  ): Promise<number> {
    // Check if app already exists
    const existing = this.config.apps.find(app => app.id === id);
    if (existing) {
      return existing.port;
    }

    // Get next available port
    const port = await this.getNextAvailablePort();

    // Add app to config
    const appConfig: AppPortConfig = {
      id,
      name,
      port,
      description,
      enabled: true,
      type,
      status: 'stopped'
    };

    this.config.apps.push(appConfig);
    this.saveConfig();

    return port;
  }

  /**
   * Get port for an app
   */
  getPort(appId: string): number | null {
    const app = this.config.apps.find(a => a.id === appId);
    return app ? app.port : null;
  }

  /**
   * Get all app configurations
   */
  getAllApps(): AppPortConfig[] {
    return [...this.config.apps];
  }

  /**
   * Get enabled apps
   */
  getEnabledApps(): AppPortConfig[] {
    return this.config.apps.filter(app => app.enabled);
  }

  /**
   * Update app status
   */
  updateAppStatus(appId: string, status: 'running' | 'stopped' | 'starting'): void {
    const app = this.config.apps.find(a => a.id === appId);
    if (app) {
      app.status = status;
      app.url = status === 'running' ? `http://localhost:${app.port}` : undefined;
      this.saveConfig();
    }
  }

  /**
   * Remove an app
   */
  removeApp(appId: string): void {
    this.config.apps = this.config.apps.filter(app => app.id !== appId);
    this.saveConfig();
  }

  /**
   * Get app configuration
   */
  getApp(appId: string): AppPortConfig | null {
    return this.config.apps.find(app => app.id === appId) || null;
  }

  /**
   * Update app configuration
   */
  updateApp(appId: string, updates: Partial<AppPortConfig>): void {
    const app = this.config.apps.find(a => a.id === appId);
    if (app) {
      Object.assign(app, updates);
      this.saveConfig();
    }
  }
}

// Singleton instance
let portManagerInstance: PortManager | null = null;

export function getPortManager(configPath?: string): PortManager {
  if (!portManagerInstance) {
    portManagerInstance = new PortManager(configPath);
  }
  return portManagerInstance;
}

export default PortManager;

