import fs from 'fs';
import path from 'path';

export interface AppConfig {
  id: string;
  name: string;
  baseUrl: string;
  description?: string;
  enabled: boolean;
}

let appsConfig: AppConfig[] = [];

/**
 * Load apps configuration from file
 */
export function loadAppsConfig(): AppConfig[] {
  // Use root config/apps.json (go up from middleware/dist/config to root)
  const configPath = process.env.APPS_CONFIG_PATH || 
    path.join(__dirname, '../../../config/apps.json');
  
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8');
      appsConfig = JSON.parse(data);
    } else {
      // Default config
      appsConfig = [
        {
          id: 'app1',
          name: 'App 1',
          baseUrl: 'http://localhost:3001',
          enabled: true
        },
        {
          id: 'app2',
          name: 'App 2',
          baseUrl: 'http://localhost:3002',
          enabled: true
        }
      ];
    }
  } catch (error) {
    console.error('Error loading apps config:', error);
    appsConfig = [];
  }

  return appsConfig;
}

/**
 * Get apps configuration
 */
export function getAppConfig(): AppConfig[] {
  if (appsConfig.length === 0) {
    return loadAppsConfig();
  }
  return appsConfig.filter(app => app.enabled);
}

// Load config on module load
loadAppsConfig();

