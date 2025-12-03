'use client'

import { AppPortConfig } from './AppCard'
import styles from './Sidebar.module.css'

interface SidebarProps {
  apps: AppPortConfig[]
  selectedApp: AppPortConfig | null
  onSelectApp: (app: AppPortConfig) => void
  onStart: (appId: string) => void
  onStop: (appId: string) => void
  isMobile?: boolean
  onClose?: () => void
}

export function Sidebar({ apps, selectedApp, onSelectApp, onStart, onStop, isMobile = false, onClose }: SidebarProps) {
  return (
    <div className={`${styles.sidebar} ${isMobile ? styles.mobile : ''}`}>
      {isMobile && onClose && (
        <button className={styles.closeButton} onClick={onClose} aria-label="Close sidebar">
          ✕
        </button>
      )}
      <div className={styles.header}>
        <h2 className={styles.title}>Applications</h2>
      </div>

      <div className={styles.appList}>
        {apps.length === 0 ? (
          <div className={styles.empty}>
            <p>No apps available</p>
          </div>
        ) : (
          apps.map((app) => {
            const isSelected = selectedApp?.id === app.id
            return (
              <div
                key={app.id}
                className={`${styles.appItem} ${isSelected ? styles.selected : ''} ${app.status === 'running' ? styles.running : styles.stopped}`}
                onClick={() => onSelectApp(app)}
              >
                <div className={styles.appHeader}>
                  <div className={styles.appInfo}>
                    <h3 className={styles.appName}>{app.name}</h3>
                    <span className={styles.appType}>{app.type}</span>
                  </div>
                  <div className={`${styles.statusDot} ${styles[app.status || 'stopped']}`} />
                </div>
                
                {app.description && (
                  <p className={styles.appDescription}>{app.description}</p>
                )}

                <div className={styles.appActions}>
                  {app.status === 'running' ? (
                    <>
                      {app.url && (
                        <a
                          href={app.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.openButton}
                          onClick={(e) => e.stopPropagation()}
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
                    <button
                      className={styles.startButton}
                      onClick={(e) => {
                        e.stopPropagation()
                        onStart(app.id)
                      }}
                    >
                      Start
                    </button>
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

