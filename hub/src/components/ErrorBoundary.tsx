'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import styles from './ErrorBoundary.module.css'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className={styles.errorContainer}>
          <div className={styles.errorContent}>
            <div className={styles.errorIcon}>
              <svg viewBox="0 0 100 100" className={styles.iconSvg}>
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="3" className={styles.iconCircle} />
                <path d="M 30 30 L 70 70 M 70 30 L 30 70" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className={styles.iconX} />
              </svg>
            </div>
            <h1 className={styles.errorTitle}>Something went wrong</h1>
            <p className={styles.errorMessage}>
              Assist encountered an unexpected error. Don't worry, your data is safe.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className={styles.errorDetails}>
                <summary className={styles.errorSummary}>Error Details (Development Only)</summary>
                <pre className={styles.errorStack}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <div className={styles.errorActions}>
              <button onClick={this.handleReset} className={styles.retryButton}>
                🔄 Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className={styles.reloadButton}
              >
                🔃 Reload Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

