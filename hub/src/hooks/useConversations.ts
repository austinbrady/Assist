import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'

const BACKEND_URL = 'http://localhost:4202'

export interface Conversation {
  conversation_id: string
  summary: string
  updated_at: string
  message_count: number
}

export function useConversations() {
  const { user, isAuthenticated } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchConversations = async () => {
    if (!isAuthenticated || !user) {
      setConversations([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('assisant_ai_token')
      const response = await fetch(`${BACKEND_URL}/api/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      } else {
        setError('Failed to load conversations')
        setConversations([])
      }
    } catch (err) {
      console.error('Error fetching conversations:', err)
      setError('Failed to load conversations')
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()
    // Refresh conversations every 30 seconds
    const interval = setInterval(fetchConversations, 30000)
    return () => clearInterval(interval)
  }, [isAuthenticated, user])

  const deleteConversation = async (conversationId: string) => {
    if (!isAuthenticated || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    try {
      const token = localStorage.getItem('assisant_ai_token')
      const response = await fetch(`${BACKEND_URL}/api/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        // Remove from local state immediately for better UX
        setConversations(prev => prev.filter(conv => conv.conversation_id !== conversationId))
        return { success: true }
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to delete conversation' }))
        return { success: false, error: errorData.detail || 'Failed to delete conversation' }
      }
    } catch (err) {
      console.error('Error deleting conversation:', err)
      return { success: false, error: 'Failed to delete conversation' }
    }
  }

  return { conversations, loading, error, refresh: fetchConversations, deleteConversation }
}
