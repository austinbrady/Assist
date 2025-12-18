'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { ChatWindow } from '@/components/ChatWindow'
import { Toolbar } from '@/components/Toolbar'
import { ErrorDisplay } from '@/components/ErrorDisplay'
import { useApps } from '@/hooks/useApps'
import { useMobile } from '@/hooks/useMobile'
import { AppPortConfig } from '@/components/AppCard'
import styles from './page.module.css'

export default function Home() {
  const { apps, loading, refresh, startApp, stopApp, error } = useApps()
  const { isMobile, isTablet } = useMobile()
  const [selectedApp, setSelectedApp] = useState<AppPortConfig | null>(null)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [showSidebar, setShowSidebar] = useState(!isMobile)

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [refresh])

  const handleStart = async (appId: string) => {
    try {
      await startApp(appId)
      // Auto-select the app if it becomes running
      setTimeout(() => {
        const app = apps.find(a => a.id === appId)
        if (app && app.status === 'running') {
          setSelectedApp(app)
        }
      }, 2000)
    } catch (err) {
      console.error('Failed to start app:', err)
    }
  }

  const handleStop = async (appId: string) => {
    try {
      await stopApp(appId)
      // Clear selection if the selected app was stopped
      if (selectedApp?.id === appId) {
        setSelectedApp(null)
      }
    } catch (err) {
      console.error('Failed to stop app:', err)
    }
  }

  const handleNavigateToApp = (app: AppPortConfig | null) => {
    if (!app) {
      setSelectedApp(null)
      return
    }

    if (app.status === 'running' && app.url) {
      // Open in new tab
      window.open(app.url, '_blank')
      setSelectedApp(app)
    } else {
      // Select the app (user can start it from sidebar)
      setSelectedApp(app)
    }
  }

  const handleSelectConversation = (conversationId: string | null) => {
    setSelectedConversationId(conversationId)
  }

  return (
    <div className={styles.container}>
      <Toolbar />
      {error && (
        <div style={{ padding: '0 1rem', marginTop: '1rem' }}>
          <ErrorDisplay
            error={error}
            type="warning"
            title="Connection Issue"
            onDismiss={() => refresh()}
          />
        </div>
      )}

      <div className={styles.layout}>
        {(showSidebar || !isMobile) && (
          <Sidebar
            apps={apps}
            selectedApp={selectedApp}
            selectedConversationId={selectedConversationId}
            onSelectApp={setSelectedApp}
            onSelectConversation={handleSelectConversation}
            onStart={handleStart}
            onStop={handleStop}
            isMobile={isMobile}
            onClose={() => setShowSidebar(false)}
          />
        )}
        <ChatWindow
          selectedApp={selectedApp}
          apps={apps}
          conversationId={selectedConversationId}
          onNavigateToApp={handleNavigateToApp}
          isMobile={isMobile}
          onMenuClick={() => setShowSidebar(true)}
        />
      </div>
    </div>
  )
}

