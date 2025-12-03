'use client'

import styles from './StatusIndicator.module.css'

interface StatusIndicatorProps {
  status: 'running' | 'stopped' | 'starting'
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
  return (
    <div className={styles.container}>
      <div
        className={`${styles.dot} ${styles[status]}`}
        title={status.charAt(0).toUpperCase() + status.slice(1)}
      />
      <span className={styles.label}>{status}</span>
    </div>
  )
}

