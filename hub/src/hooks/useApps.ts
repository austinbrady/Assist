'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

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

export function useApps() {
  const [apps, setApps] = useState<AppPortConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchApps = useCallback(async () => {
    try {
      setError(null)
      const response = await axios.get(`${API_URL}/api/hub/apps`)
      setApps(response.data.apps || [])
    } catch (error: any) {
      console.error('Error fetching apps:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Failed to connect to middleware API'
      setError(`Unable to connect to middleware (${API_URL}). Make sure middleware is running.`)
      setApps([])
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = useCallback(() => {
    fetchApps()
  }, [fetchApps])

  const startApp = useCallback(async (appId: string) => {
    try {
      await axios.post(`${API_URL}/api/hub/apps/${appId}/start`)
      await fetchApps()
    } catch (error) {
      console.error('Error starting app:', error)
      alert('Failed to start app')
    }
  }, [fetchApps])

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

