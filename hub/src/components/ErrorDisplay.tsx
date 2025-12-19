'use client'

import React from 'react'
import styles from './ErrorDisplay.module.css'

interface ErrorDisplayProps {
  error: string | Error | null
  onDismiss?: () => void
  type?: 'error' | 'warning' | 'info'
  title?: string
}

function isChromeExtensionError(error: string | Error): boolean {
  // Safely extract message and ensure it's a string
  let message: string
  if (error instanceof Error) {
    message = error.message || String(error)
  } else if (typeof error === 'string') {
    message = error
  } else {
    // Handle cases where error might be an object or other type
    message = String(error)
  }
  
  // Ensure message is a string before calling toLowerCase
  if (typeof message !== 'string') {
    message = String(message)
  }
  
  const errorStr = message.toLowerCase()
  return (
    errorStr.includes('chrome-extension://') ||
    errorStr.includes('sensilet') ||
    errorStr.includes('exodus') ||
    errorStr.includes('backpack') ||
    errorStr.includes('yours wallet') ||
    errorStr.includes('cannot redefine property: solana') ||
    errorStr.includes('cannot redefine property: ethereum') ||
    errorStr.includes('denying load of chrome-extension://') ||
    errorStr.includes('origins don\'t match') ||
    errorStr.includes('failed to fetch dynamically imported module: chrome-extension://') ||
    errorStr.includes('web_accessible_resources') ||
    (errorStr.includes('securityerror') && errorStr.includes('chrome-extension://'))
  )
}

export function ErrorDisplay({ error, onDismiss, type = 'error', title }: ErrorDisplayProps) {
  if (!error) return null

  // Filter out Chrome extension errors (only if error is string or Error)
  if (typeof error === 'string' || error instanceof Error) {
    if (isChromeExtensionError(error)) {
      return null
    }
  }

  // Safely extract error message
  let errorMessage: string
  if (error instanceof Error) {
    errorMessage = error.message || String(error)
  } else if (typeof error === 'string') {
    errorMessage = error
  } else {
    // Handle cases where error might be an object or other type
    errorMessage = String(error)
  }

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

