'use client'

import { StatusIndicator } from './StatusIndicator'
import styles from './AppCard.module.css'

// Type definition
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

interface AppCardProps {
  app: AppPortConfig
  onStart: () => void
  onStop: () => void
  isLoading?: boolean
}

export function AppCard({ app, onStart, onStop, isLoading = false }: AppCardProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'backend':
        return '#ef4444'
      case 'frontend':
        return '#3b82f6'
      case 'middleware':
        return '#10b981'
      default:
        return '#6b7280'
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>{app.name}</h3>
          <span
            className={styles.typeBadge}
            style={{ backgroundColor: getTypeColor(app.type) }}
          >
            {app.type}
          </span>
        </div>
        <StatusIndicator status={app.status || 'stopped'} />
      </div>

      {app.description && (
        <p className={styles.description}>{app.description}</p>
      )}

      <div className={styles.info}>
        <div className={styles.infoRow}>
          <span className={styles.label}>Port:</span>
          <span className={styles.value}>{app.port}</span>
        </div>
        {app.url && (
          <div className={styles.infoRow}>
            <span className={styles.label}>URL:</span>
            <a
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              {app.url}
            </a>
          </div>
        )}
        <div className={styles.infoRow}>
          <span className={styles.label}>ID:</span>
          <span className={styles.value}>{app.id}</span>
        </div>
      </div>

      <div className={styles.actions}>
        {app.status === 'running' ? (
          <button
            onClick={onStop}
            disabled={isLoading}
            className={`${styles.button} ${styles.stopButton} ${isLoading ? styles.disabled : ''}`}
          >
            {isLoading ? 'Stopping...' : 'Stop'}
          </button>
        ) : (
          <button
            onClick={onStart}
            disabled={isLoading || app.status === 'starting'}
            className={`${styles.button} ${styles.startButton} ${isLoading || app.status === 'starting' ? styles.disabled : ''}`}
          >
            {isLoading || app.status === 'starting' ? 'Starting...' : 'Start'}
          </button>
        )}
        {app.url && app.status === 'running' && (
          <a
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.button} ${styles.openButton}`}
          >
            Open
          </a>
        )}
      </div>
    </div>
  )
}

