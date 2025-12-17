'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import styles from './Permissions.module.css'

export interface DataSourcePermission {
  id: string
  name: string
  description: string
  icon: string
  enabled: boolean
  lastUsed?: string
  dataCollected?: string[]
}

const DATA_SOURCES: Omit<DataSourcePermission, 'enabled' | 'lastUsed' | 'dataCollected'>[] = [
  {
    id: 'email',
    name: 'Email',
    description: 'Learn from your emails to understand your work patterns, contacts, and communication style',
    icon: '📧'
  },
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'Understand your schedule, meetings, and time management patterns',
    icon: '📅'
  },
  {
    id: 'files',
    name: 'Files & Documents',
    description: 'Learn from your documents to understand your projects and work context',
    icon: '📁'
  },
  {
    id: 'conversations',
    name: 'Conversations',
    description: 'Learn from your chat history to understand your preferences and needs (always enabled)',
    icon: '💬'
  }
]

const MIDDLEWARE_URL = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:4199'

export function Permissions({ onClose }: { onClose?: () => void }) {
  const { user, isAuthenticated } = useAuth()
  const [permissions, setPermissions] = useState<DataSourcePermission[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (isAuthenticated && user) {
      loadPermissions()
    }
  }, [isAuthenticated, user])

  const loadPermissions = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const token = localStorage.getItem('assisant_ai_token')
      const response = await fetch(`${MIDDLEWARE_URL}/api/learner/permissions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        // Merge with default data sources
        const merged = DATA_SOURCES.map(source => {
          const saved = data.permissions?.find((p: DataSourcePermission) => p.id === source.id)
          return {
            ...source,
            enabled: saved?.enabled ?? (source.id === 'conversations' ? true : false),
            lastUsed: saved?.lastUsed,
            dataCollected: saved?.dataCollected || []
          }
        })
        setPermissions(merged)
      } else {
        // If API fails, use defaults
        const defaults = DATA_SOURCES.map(source => ({
          ...source,
          enabled: source.id === 'conversations' ? true : false
        }))
        setPermissions(defaults)
      }
    } catch (error) {
      console.error('Failed to load permissions:', error)
      // Use defaults on error
      const defaults = DATA_SOURCES.map(source => ({
        ...source,
        enabled: source.id === 'conversations' ? true : false
      }))
      setPermissions(defaults)
    } finally {
      setLoading(false)
    }
  }

  const savePermissions = async () => {
    if (!user) return

    setSaving(true)
    setMessage(null)
    
    try {
      const token = localStorage.getItem('assisant_ai_token')
      const response = await fetch(`${MIDDLEWARE_URL}/api/learner/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          permissions: permissions.map(p => ({
            id: p.id,
            enabled: p.enabled
          }))
        }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Permissions saved successfully' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: 'Failed to save permissions' })
      }
    } catch (error) {
      console.error('Failed to save permissions:', error)
      setMessage({ type: 'error', text: 'Error saving permissions' })
    } finally {
      setSaving(false)
    }
  }

  const togglePermission = (id: string) => {
    // Conversations is always enabled
    if (id === 'conversations') return
    
    setPermissions(prev => prev.map(p => 
      p.id === id ? { ...p, enabled: !p.enabled } : p
    ))
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.permissions}>
        <p>Please log in to manage permissions.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={styles.permissions}>
        <p>Loading permissions...</p>
      </div>
    )
  }

  return (
    <div className={styles.permissionsContainer}>
      <div className={styles.permissions}>
        <div className={styles.header}>
          <h2>Data Permissions</h2>
          <p className={styles.subtitle}>
            Control what data sources Assist can learn from to better understand you and your needs.
            All data is processed locally and never shared with third parties.
          </p>
          {onClose && (
            <button
              onClick={onClose}
              className={styles.closeButton}
              title="Close Permissions"
              aria-label="Close Permissions"
            >
              ×
            </button>
          )}
        </div>

        {message && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}

        <div className={styles.permissionsList}>
          {permissions.map((permission) => (
            <div
              key={permission.id}
              className={`${styles.permissionItem} ${permission.enabled ? styles.enabled : styles.disabled}`}
            >
              <div className={styles.permissionHeader}>
                <div className={styles.permissionInfo}>
                  <span className={styles.icon}>{permission.icon}</span>
                  <div>
                    <h3 className={styles.permissionName}>{permission.name}</h3>
                    <p className={styles.permissionDescription}>{permission.description}</p>
                  </div>
                </div>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={permission.enabled}
                    onChange={() => togglePermission(permission.id)}
                    disabled={permission.id === 'conversations'}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
              
              {permission.enabled && permission.lastUsed && (
                <div className={styles.permissionMeta}>
                  <span className={styles.metaItem}>
                    Last used: {new Date(permission.lastUsed).toLocaleDateString()}
                  </span>
                </div>
              )}

              {permission.enabled && permission.dataCollected && permission.dataCollected.length > 0 && (
                <div className={styles.dataCollected}>
                  <span className={styles.dataLabel}>Data collected:</span>
                  <div className={styles.dataTags}>
                    {permission.dataCollected.map((item, idx) => (
                      <span key={idx} className={styles.dataTag}>{item}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <div className={styles.privacyNote}>
            <strong>Privacy Promise:</strong> All data is processed locally on your device. 
            We never send your data to external services or third parties. 
            You can revoke permissions at any time.
          </div>
          <button
            onClick={savePermissions}
            disabled={saving}
            className={styles.saveButton}
          >
            {saving ? 'Saving...' : 'Save Permissions'}
          </button>
        </div>
      </div>
    </div>
  )
}

