'use client'

import React from 'react'
import styles from './ErrorDisplay.module.css'

interface ErrorDisplayProps {
  error: string | Error | null
  onDismiss?: () => void
  type?: 'error' | 'warning' | 'info'
  title?: string
}

export function ErrorDisplay({ error, onDismiss, type = 'error', title }: ErrorDisplayProps) {
  if (!error) return null

  const errorMessage = error instanceof Error ? error.message : error

  return (
    <div className={`${styles.errorDisplay} ${styles[type]}`}>
      <div className={styles.errorContent}>
        <div className={styles.errorIcon}>
          {type === 'error' && '⚠️'}
          {type === 'warning' && '⚡'}
          {type === 'info' && 'ℹ️'}
        </div>
        <div className={styles.errorText}>
          {title && <div className={styles.errorTitle}>{title}</div>}
          <div className={styles.errorMessage}>{errorMessage}</div>
        </div>
        {onDismiss && (
          <button
            className={styles.dismissButton}
            onClick={onDismiss}
            aria-label="Dismiss error"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}

