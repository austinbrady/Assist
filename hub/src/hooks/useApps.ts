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
      
      // Always provide URLs - apps can be accessed directly
      const initialApps = MAIN_APPS.map(app => ({
        ...app,
        status: 'stopped' as const,
        url: `http://${baseUrl}:${app.port}`
      }))
      setApps(initialApps)
      setLoading(false)
      
      // Then try to fetch from middleware API and update status
      try {
        const response = await axios.get(`${API_URL}/api/hub/apps`)
        const apiApps = response.data.apps || []
        
        // Update apps with API status, but always keep URLs
        const updatedApps = MAIN_APPS.map((mainApp) => {
          const apiApp = apiApps.find((a: AppPortConfig) => a.id === mainApp.id)
          const status = apiApp?.status || 'stopped'
          
          return {
            ...mainApp,
            status,
            url: `http://${baseUrl}:${mainApp.port}` // Always provide URL
          }
        })
        
        setApps(updatedApps)
      } catch (apiError: any) {
        console.log('API not available, checking app status manually')
        // Fallback: check status manually for each app
        const appsWithStatus = await Promise.all(
          MAIN_APPS.map(async (app) => {
            const status = await checkAppStatus(app)
            return {
              ...app,
              status,
              url: `http://${baseUrl}:${app.port}` // Always provide URL
            }
          })
        )
        setApps(appsWithStatus)
      }
    } catch (error: any) {
      console.error('Error fetching apps:', error)
      // Even on error, show the hardcoded apps with URLs
      setApps(MAIN_APPS.map(app => ({ 
        ...app, 
        status: 'stopped' as const,
        url: `http://${baseUrl}:${app.port}`
      })))
      setError(null) // Don't show error if we have fallback apps
      setLoading(false)
    }
  }, [baseUrl])

  const refresh = useCallback(() => {
    fetchApps()
  }, [fetchApps])

  // Simplified: just return the URL - no API calls needed
  const startApp = useCallback(async (appId: string): Promise<{ success: boolean; url?: string; error?: string }> => {
    const app = MAIN_APPS.find(a => a.id === appId)
    if (app) {
      return { 
        success: true, 
        url: `http://${baseUrl}:${app.port}` 
      }
    }
    return { success: false, error: 'App not found' }
  }, [baseUrl])

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

