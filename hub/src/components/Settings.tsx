'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import styles from './Settings.module.css'

interface UserVariables {
  [key: string]: string | number | boolean | string[]
}

interface EmailConfig {
  email: string
  password: string
  provider: 'gmail' | 'outlook' | 'imap'
  imap_server?: string
  imap_port?: number
}

interface SettingsData {
  userVariables: UserVariables
  emailConfig: EmailConfig | null
  reminders: {
    birthdays: boolean
    payments: boolean
    tasks: boolean
  }
  businessContext: {
    companyName?: string
    industry?: string
    roles?: string[]
    teamMembers?: Array<{ name: string; expertise: string[]; performance: Record<string, number> }>
  }
}

const BACKEND_URL = 'http://localhost:4202'

export function Settings() {
  const { user, isAuthenticated } = useAuth()
  const [settings, setSettings] = useState<SettingsData>({
    userVariables: {},
    emailConfig: null,
    reminders: {
      birthdays: true,
      payments: true,
      tasks: true,
    },
    businessContext: {},
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (isAuthenticated && user) {
      loadSettings()
    }
  }, [isAuthenticated, user])

  const loadSettings = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const token = localStorage.getItem('assisant_ai_token')
      const response = await fetch(`${BACKEND_URL}/api/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!user) return

    setSaving(true)
    setMessage(null)
    
    try {
      const token = localStorage.getItem('assisant_ai_token')
      const response = await fetch(`${BACKEND_URL}/api/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully' })
        
        // If email config is provided, trigger email scanning
        if (settings.emailConfig?.email && settings.emailConfig?.password) {
          triggerEmailScan()
        }
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings' })
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      setMessage({ type: 'error', text: 'Error saving settings' })
    } finally {
      setSaving(false)
    }
  }

  const triggerEmailScan = async () => {
    if (!user || !settings.emailConfig) return

    try {
      const token = localStorage.getItem('assisant_ai_token')
      await fetch(`${BACKEND_URL}/api/email/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: settings.emailConfig.email,
          password: settings.emailConfig.password,
          provider: settings.emailConfig.provider,
        }),
      })
    } catch (error) {
      console.error('Failed to trigger email scan:', error)
    }
  }

  const addUserVariable = () => {
    const key = prompt('Variable name:')
    if (key) {
      setSettings(prev => ({
        ...prev,
        userVariables: {
          ...prev.userVariables,
          [key]: '',
        },
      }))
    }
  }

  const updateUserVariable = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      userVariables: {
        ...prev.userVariables,
        [key]: value,
      },
    }))
  }

  const removeUserVariable = (key: string) => {
    setSettings(prev => {
      const newVars = { ...prev.userVariables }
      delete newVars[key]
      return {
        ...prev,
        userVariables: newVars,
      }
    })
  }

  const addTeamMember = () => {
    const name = prompt('Team member name:')
    if (name) {
      setSettings(prev => ({
        ...prev,
        businessContext: {
          ...prev.businessContext,
          teamMembers: [
            ...(prev.businessContext.teamMembers || []),
            { name, expertise: [], performance: {} },
          ],
        },
      }))
    }
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.settings}>
        <p>Please log in to access settings.</p>
      </div>
    )
  }

  return (
    <div className={styles.settings}>
      <h2>Settings</h2>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      {/* User Variables */}
      <section className={styles.section}>
        <h3>User Variables</h3>
        <p className={styles.sectionDescription}>
          Add variables to help AI understand you better. These can include preferences, context, or any information that helps the AI assist you.
        </p>
        <div className={styles.variablesList}>
          {Object.entries(settings.userVariables).map(([key, value]) => (
            <div key={key} className={styles.variableItem}>
              <input
                type="text"
                value={key}
                readOnly
                className={styles.variableKey}
              />
              <input
                type="text"
                value={String(value)}
                onChange={(e) => updateUserVariable(key, e.target.value)}
                className={styles.variableValue}
                placeholder="Value"
              />
              <button
                onClick={() => removeUserVariable(key)}
                className={styles.removeButton}
              >
                ×
              </button>
            </div>
          ))}
          <button onClick={addUserVariable} className={styles.addButton}>
            + Add Variable
          </button>
        </div>
      </section>

      {/* Email Configuration */}
      <section className={styles.section}>
        <h3>Email Integration</h3>
        <p className={styles.sectionDescription}>
          Connect your email to enable scanning for reminders, tasks, and context. This helps the AI understand your schedule and needs.
        </p>
        <div className={styles.emailConfig}>
          <div className={styles.formGroup}>
            <label>Email Address</label>
            <input
              type="email"
              value={settings.emailConfig?.email || ''}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                emailConfig: {
                  ...prev.emailConfig || {} as EmailConfig,
                  email: e.target.value,
                  provider: prev.emailConfig?.provider || 'gmail',
                } as EmailConfig,
              }))}
              placeholder="your.email@example.com"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Password / App Password</label>
            <input
              type="password"
              value={settings.emailConfig?.password || ''}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                emailConfig: {
                  ...prev.emailConfig || {} as EmailConfig,
                  password: e.target.value,
                  provider: prev.emailConfig?.provider || 'gmail',
                } as EmailConfig,
              }))}
              placeholder="Password or app-specific password"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Email Provider</label>
            <select
              value={settings.emailConfig?.provider || 'gmail'}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                emailConfig: {
                  ...prev.emailConfig || {} as EmailConfig,
                  provider: e.target.value as 'gmail' | 'outlook' | 'imap',
                } as EmailConfig,
              }))}
            >
              <option value="gmail">Gmail</option>
              <option value="outlook">Outlook</option>
              <option value="imap">IMAP (Custom)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Reminders */}
      <section className={styles.section}>
        <h3>Reminders</h3>
        <p className={styles.sectionDescription}>
          Enable automatic reminders for important events and tasks.
        </p>
        <div className={styles.remindersList}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={settings.reminders.birthdays}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                reminders: { ...prev.reminders, birthdays: e.target.checked },
              }))}
            />
            <span>Birthday Reminders</span>
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={settings.reminders.payments}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                reminders: { ...prev.reminders, payments: e.target.checked },
              }))}
            />
            <span>Payment Reminders</span>
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={settings.reminders.tasks}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                reminders: { ...prev.reminders, tasks: e.target.checked },
              }))}
            />
            <span>Task Reminders</span>
          </label>
        </div>
      </section>

      {/* Business Context */}
      <section className={styles.section}>
        <h3>Business Context</h3>
        <p className={styles.sectionDescription}>
          Help the AI understand your business for better staffing and role suggestions.
        </p>
        <div className={styles.businessConfig}>
          <div className={styles.formGroup}>
            <label>Company Name</label>
            <input
              type="text"
              value={settings.businessContext.companyName || ''}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                businessContext: {
                  ...prev.businessContext,
                  companyName: e.target.value,
                },
              }))}
              placeholder="e.g., Leo Presents"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Industry</label>
            <input
              type="text"
              value={settings.businessContext.industry || ''}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                businessContext: {
                  ...prev.businessContext,
                  industry: e.target.value,
                },
              }))}
              placeholder="e.g., Tour Production, K-pop Events"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Common Roles</label>
            <input
              type="text"
              value={settings.businessContext.roles?.join(', ') || ''}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                businessContext: {
                  ...prev.businessContext,
                  roles: e.target.value.split(',').map(r => r.trim()).filter(r => r),
                },
              }))}
              placeholder="VIP Coordinator, Tour Manager, etc. (comma-separated)"
            />
          </div>
          <div className={styles.teamMembers}>
            <h4>Team Members</h4>
            {settings.businessContext.teamMembers?.map((member, idx) => (
              <div key={idx} className={styles.teamMember}>
                <strong>{member.name}</strong>
                <div>Expertise: {member.expertise.join(', ') || 'None'}</div>
                <div>Performance: {JSON.stringify(member.performance)}</div>
              </div>
            ))}
            <button onClick={addTeamMember} className={styles.addButton}>
              + Add Team Member
            </button>
          </div>
        </div>
      </section>

      <button
        onClick={saveSettings}
        disabled={saving}
        className={styles.saveButton}
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  )
}

