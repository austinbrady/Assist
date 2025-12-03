import { useState, useEffect, useCallback } from 'react'

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  fileUrl?: string
  filePath?: string
  action?: {
    label: string
    onClick: () => void
  }
  read: boolean
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Load notifications from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('assisant_ai_notifications')
    if (stored) {
      try {
        const parsed = JSON.parse(stored).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }))
        setNotifications(parsed)
        updateUnreadCount(parsed)
      } catch (e) {
        console.error('Failed to load notifications:', e)
      }
    }
  }, [])

  // Save notifications to localStorage
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('assisant_ai_notifications', JSON.stringify(notifications))
      updateUnreadCount(notifications)
    }
  }, [notifications])

  const updateUnreadCount = (notifs: Notification[]) => {
    setUnreadCount(notifs.filter(n => !n.read).length)
  }

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
    }
    setNotifications(prev => [newNotification, ...prev])
  }, [])

  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
    
    // Also mark as read on backend
    const token = localStorage.getItem('assisant_ai_token')
    if (token) {
      try {
        await fetch(`http://localhost:4202/api/notifications/${id}/read`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      } catch (e) {
        // Silently handle errors
      }
    }
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const deleteNotification = useCallback(async (id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id)
      if (updated.length === 0) {
        localStorage.removeItem('assisant_ai_notifications')
      }
      return updated
    })
    
    // Also delete on backend
    const token = localStorage.getItem('assisant_ai_token')
    if (token) {
      try {
        await fetch(`http://localhost:4202/api/notifications/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      } catch (e) {
        // Silently handle errors
      }
    }
  }, [])

  const clearNotifications = useCallback(async () => {
    setNotifications([])
    localStorage.removeItem('assisant_ai_notifications')
    
    // Also clear on backend
    const token = localStorage.getItem('assisant_ai_token')
    if (token) {
      try {
        await fetch('http://localhost:4202/api/notifications/clear', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      } catch (e) {
        // Silently handle errors
      }
    }
  }, [])

  // Poll for notifications from backend
  useEffect(() => {
    const token = localStorage.getItem('assisant_ai_token')
    if (!token) return

    const fetchNotifications = async () => {
      try {
        const response = await fetch('http://localhost:4202/api/notifications', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          const backendNotifications = data.notifications || []
          
          // Merge with local notifications (avoid duplicates)
          setNotifications(prev => {
            const existingIds = new Set(prev.map(n => n.id))
            const newBackendNotifications = backendNotifications
              .filter((n: any) => !existingIds.has(n.id))
              .map((n: any) => ({
                ...n,
                timestamp: new Date(n.timestamp),
                read: n.read || false
              }))
            
            return [...newBackendNotifications, ...prev]
          })
        }
      } catch (e) {
        // Silently handle errors
      }
    }

    // Fetch immediately
    fetchNotifications()
    
    // Poll every 5 seconds
    const interval = setInterval(fetchNotifications, 5000)
    
    return () => clearInterval(interval)
  }, [])

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearNotifications,
  }
}

