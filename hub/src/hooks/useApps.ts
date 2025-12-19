'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { MAIN_APPS, checkAppStatus } from '@/config/apps'
import { useNetworkIP } from './useNetworkIP'

// Type definition (matches port-manager)
export interface AppPortConfig {
  id: string
  name: string
  port: number
  description?: string
  enabled: boolean
  type: 'backend' | 'frontend' | 'middleware'
  status?: 'running' | 'stopped' | 'starting'
  url?: string
}

const API_URL = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:4199'

// Helper to get base URL (localhost or network IP)
function getBaseUrl(): string {
  if (typeof window === 'undefined') return 'localhost'
  
  // If accessing via network IP, use network IP for app URLs
  const currentHost = window.location.hostname
  if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
    return currentHost
  }
  
  // Otherwise use localhost
  return 'localhost'
}

export function useApps() {
  const [apps, setApps] = useState<AppPortConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const baseUrl = getBaseUrl()

  const fetchApps = useCallback(async () => {
    try {
      setError(null)
      
      // Try to fetch from middleware API first (primary source of truth)
      try {
        const response = await axios.get(`${API_URL}/api/hub/apps`)
        const apiApps = response.data.apps || []
        
        // Filter to show only frontend apps (users interact with frontends)
        // Also exclude hub and middleware from the list
        const frontendApps = apiApps.filter((app: AppPortConfig) => 
          app.type === 'frontend' && 
          app.enabled !== false &&
          app.id !== 'hub' // Don't show hub in its own sidebar
        )
        
        // Update with status and URLs
        const appsWithStatus = frontendApps.map((app: AppPortConfig) => ({
          ...app,
          status: app.status || 'stopped',
          url: `http://${baseUrl}:${app.port}`
        }))
        
        setApps(appsWithStatus)
        setLoading(false)
        return
      } catch (apiError: any) {
        console.log('API not available, using fallback apps')
        // Fallback to MAIN_APPS if API unavailable
        const appsWithStatus = await Promise.all(
          MAIN_APPS.map(async (app) => {
            const status = await checkAppStatus(app)
            return {
              ...app,
              status,
              url: `http://${baseUrl}:${app.port}`
            }
          })
        )
        setApps(appsWithStatus)
        setLoading(false)
      }
    } catch (error: any) {
      console.error('Error fetching apps:', error)
      // Final fallback to MAIN_APPS
      setApps(MAIN_APPS.map(app => ({ 
        ...app, 
        status: 'stopped' as const,
        url: `http://${baseUrl}:${app.port}`
      })))
      setError(null)
      setLoading(false)
    }
  }, [baseUrl])

  const refresh = useCallback(() => {
    fetchApps()
  }, [fetchApps])

  // Start app via middleware API
  const startApp = useCallback(async (appId: string): Promise<{ success: boolean; url?: string; error?: string }> => {
    try {
      // Find app in current apps list to get port
      const app = apps.find(a => a.id === appId)
      if (!app) {
        return { success: false, error: 'App not found' }
      }
      
      // Call middleware API to start the app
      await axios.post(`${API_URL}/api/hub/apps/${appId}/start`)
      
      // Refresh apps to get updated status
      await fetchApps()
      
      return { 
        success: true, 
        url: `http://${baseUrl}:${app.port}` 
      }
    } catch (error: any) {
      console.error('Error starting app:', error)
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to start app' 
      }
    }
  }, [baseUrl, apps, fetchApps])

  const stopApp = useCallback(async (appId: string) => {
    try {
      await axios.post(`${API_URL}/api/hub/apps/${appId}/stop`)
      await fetchApps()
    } catch (error) {
      console.error('Error stopping app:', error)
      alert('Failed to stop app')
    }
  }, [fetchApps])

  useEffect(() => {
    fetchApps()
  }, [fetchApps])

  return {
    apps,
    loading,
    error,
    refresh,
    startApp,
    stopApp,
  }
}

