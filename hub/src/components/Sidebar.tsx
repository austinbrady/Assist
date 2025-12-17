'use client'

import { useState } from 'react'
import { AppPortConfig } from './AppCard'
import { useConversations } from '@/hooks/useConversations'
import styles from './Sidebar.module.css'

interface SidebarProps {
  apps: AppPortConfig[]
  selectedApp: AppPortConfig | null
  selectedConversationId: string | null
  onSelectApp: (app: AppPortConfig | null) => void
  onSelectConversation: (conversationId: string | null) => void
  onStart: (appId: string) => void
  onStop: (appId: string) => void
  isMobile?: boolean
  onClose?: () => void
}

// Helper function to get icon emoji based on app name
const getAppIcon = (appName: string): string => {
  const name = appName.toLowerCase()
  if (name.includes('personal') || name.includes('ai')) return '🤖'
  if (name.includes('prompt')) return '✍️'
  if (name.includes('mvp')) return '🚀'
  if (name.includes('jailbreak')) return '🔓'
  if (name.includes('chat')) return '💬'
  if (name.includes('image') || name.includes('media')) return '🖼️'
  if (name.includes('video')) return '🎬'
  if (name.includes('audio') || name.includes('music')) return '🎵'
  if (name.includes('code') || name.includes('dev')) return '💻'
  if (name.includes('design')) return '🎨'
  // Default icon
  return '📱'
}

// Helper function to get short identifier from app name (e.g., "MVP Assistant" -> "MVP")
const getAppPrefix = (appName: string): string => {
  const name = appName.trim()
  // Extract first word or first part before space/common separators
  const match = name.match(/^([A-Z0-9]+)/i)
  if (match) return match[1]
  // If no match, try splitting by space
  const parts = name.split(/\s+/)
  if (parts.length > 0) return parts[0]
  return name
}

// Helper function to truncate description to 3-7 words
const truncateDescription = (description: string | undefined, maxWords: number = 7): string => {
  if (!description) return ''
  const words = description.trim().split(/\s+/)
  if (words.length <= maxWords) return description
  return words.slice(0, maxWords).join(' ') + '...'
}

export function Sidebar({ apps, selectedApp, selectedConversationId, onSelectApp, onSelectConversation, onStart, onStop, isMobile = false, onClose }: SidebarProps) {
  const { conversations, loading, refresh, deleteConversation } = useConversations()
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  // Refresh conversations when history is expanded
  const handleToggleHistory = () => {
    setIsHistoryExpanded(!isHistoryExpanded)
    if (!isHistoryExpanded) {
      refresh()
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`
      return date.toLocaleDateString()
    } catch {
      return 'Recently'
    }
  }

  const handleNewChat = () => {
    onSelectConversation(null)
    onSelectApp(null)
    if (isMobile && onClose) {
      onClose()
    }
  }

  const handleSelectConversation = (conversationId: string) => {
    onSelectConversation(conversationId)
    onSelectApp(null)
    setIsHistoryExpanded(false)
    if (isMobile && onClose) {
      onClose()
    }
  }

  const handleDeleteConversation = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation() // Prevent selecting the conversation when clicking delete
    
    if (!confirm('Are you sure you want to delete this conversation?')) {
      return
    }

    setDeletingId(conversationId)
    const result = await deleteConversation(conversationId)
    
    if (result.success) {
      // If the deleted conversation was selected, clear selection
      if (selectedConversationId === conversationId) {
        onSelectConversation(null)
      }
      // Refresh to ensure UI is in sync
      refresh()
    } else {
      alert(result.error || 'Failed to delete conversation')
    }
    
    setDeletingId(null)
  }

  return (
    <div className={`${styles.sidebar} ${isMobile ? styles.mobile : ''}`}>
      {isMobile && onClose && (
        <button className={styles.closeButton} onClick={onClose} aria-label="Close sidebar">
          ✕
        </button>
      )}

      <div className={styles.header}>
        <h2 className={styles.headerTitle}>Tools & Applications</h2>
        <p className={styles.headerSubtitle}>All available tools in AssisantAI</p>
      </div>

      <div className={styles.appList}>
        {/* Assist Button - Always at the top */}
        <div className={styles.assistContainer}>
          <div
            className={`${styles.appItem} ${selectedApp === null ? styles.selected : ''} ${styles.running}`}
            onClick={handleNewChat}
          >
            <div className={styles.appIcon}>💬</div>
            <div className={styles.appContent}>
              <div className={styles.appMain}>
                <span className={styles.appDescription}>Assist - AI Assistant with context awareness</span>
              </div>
            </div>
            <div className={styles.appRight}>
              <button
                className={styles.historyToggle}
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleHistory()
                }}
                title={isHistoryExpanded ? 'Collapse history' : 'Expand history'}
              >
                {isHistoryExpanded ? '▼' : '▶'} History
              </button>
            </div>
          </div>
          
          {/* Expandable Chat History */}
          {isHistoryExpanded && (
            <div className={styles.historyMenu}>
              {loading ? (
                <div className={styles.historyItem}>Loading...</div>
              ) : conversations.length === 0 ? (
                <div className={styles.historyItem}>No chat history</div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.conversation_id}
                    className={`${styles.historyItem} ${selectedConversationId === conv.conversation_id ? styles.historyItemSelected : ''}`}
                    onClick={() => handleSelectConversation(conv.conversation_id)}
                  >
                    <div className={styles.historyItemContent}>
                      <div className={styles.historyItemSummary}>{conv.summary || 'New conversation'}</div>
                      <div className={styles.historyItemMeta}>
                        {formatDate(conv.updated_at)} • {conv.message_count} messages
                      </div>
                    </div>
                    <button
                      className={styles.deleteButton}
                      onClick={(e) => handleDeleteConversation(e, conv.conversation_id)}
                      disabled={deletingId === conv.conversation_id}
                      title="Delete conversation"
                      aria-label="Delete conversation"
                    >
                      {deletingId === conv.conversation_id ? '...' : '×'}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {apps.length === 0 ? (
          <div className={styles.empty}>
            <p>No apps available</p>
          </div>
        ) : (
          apps.map((app) => {
            const isSelected = selectedApp?.id === app.id
            const shortDescription = truncateDescription(app.description, 7)
            const appPrefix = getAppPrefix(app.name)
            const displayText = shortDescription ? `${appPrefix} - ${shortDescription}` : appPrefix
            return (
              <div
                key={app.id}
                className={`${styles.appItem} ${isSelected ? styles.selected : ''} ${app.status === 'running' ? styles.running : styles.stopped}`}
                onClick={() => {
                  // If app is running, navigate to it with auth token
                  if (app.status === 'running' && app.url) {
                    const token = typeof window !== 'undefined' ? localStorage.getItem('assisant_ai_token') : null
                    const url = token ? `${app.url}?token=${encodeURIComponent(token)}` : app.url
                    window.open(url, '_blank')
                  } else {
                    // Otherwise, select it (user can start it)
                    onSelectApp(app)
                  }
                }}
              >
                <div className={styles.appIcon}>{getAppIcon(app.name)}</div>
                <div className={styles.appContent}>
                  <div className={styles.appMain}>
                    <span className={styles.appDescription}>{displayText}</span>
                  </div>
                </div>
                <div className={styles.appRight}>
                  {app.status === 'running' ? (
                    <>
                      {app.url && (
                        <a
                          href={app.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.openButton}
                          onClick={(e) => {
                            e.stopPropagation()
                            const token = typeof window !== 'undefined' ? localStorage.getItem('assisant_ai_token') : null
                            const url = token ? `${app.url}?token=${encodeURIComponent(token)}` : app.url
                            window.open(url, '_blank')
                          }}
                        >
                          Open
                        </a>
                      )}
                      <button
                        className={styles.stopButton}
                        onClick={(e) => {
                          e.stopPropagation()
                          onStop(app.id)
                        }}
                      >
                        Stop
                      </button>
                    </>
                  ) : (
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.startButton}
                      onClick={(e) => {
                        e.stopPropagation()
                        // Just navigate with auth token - no API call needed
                        const token = typeof window !== 'undefined' ? localStorage.getItem('assisant_ai_token') : null
                        const url = token ? `${app.url}?token=${encodeURIComponent(token)}` : app.url
                        window.open(url, '_blank')
                      }}
                    >
                      Go
                    </a>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

