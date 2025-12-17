import { AppPortConfig } from '@/hooks/useApps'

/**
 * Hardcoded list of main applications with short names
 * These are the primary tools users interact with
 */
export const MAIN_APPS: AppPortConfig[] = [
  {
    id: 'mvpassistant-frontend',
    name: 'MVP',
    port: 4204,
    description: 'MVP Assistant - Generate custom GUI applications',
    enabled: true,
    type: 'frontend',
    status: 'stopped',
    url: 'http://localhost:4204'
  },
  {
    id: 'personalai-frontend',
    name: 'Personal',
    port: 4203,
    description: 'PersonalAI - Comprehensive AI assistant with chat and automation',
    enabled: true,
    type: 'frontend',
    status: 'stopped',
    url: 'http://localhost:4203'
  },
  {
    id: 'promptwriter-frontend',
    name: 'Prompt',
    port: 4205,
    description: 'Prompt Writer - Optimize prompts for AI or humans',
    enabled: true,
    type: 'frontend',
    status: 'stopped',
    url: 'http://localhost:4205'
  }
]

/**
 * Get app by ID
 */
export function getAppById(id: string): AppPortConfig | undefined {
  return MAIN_APPS.find(app => app.id === id)
}

/**
 * Check if an app is running by checking if the port is accessible
 */
export async function checkAppStatus(app: AppPortConfig): Promise<'running' | 'stopped'> {
  try {
    // Use a timeout to avoid hanging
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1000)
    
    const response = await fetch(`http://localhost:${app.port}`, { 
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-cache'
    })
    
    clearTimeout(timeoutId)
    
    // If we get any response (even 404), the server is running
    return 'running'
  } catch (error) {
    // If fetch fails, assume the app is stopped
    return 'stopped'
  }
}

