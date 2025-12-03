'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth, User } from '@/hooks/useAuth'
import { useNotifications, Notification } from '@/hooks/useNotifications'
import { useNetworkIP } from '@/hooks/useNetworkIP'
import { ErrorDisplay } from '@/components/ErrorDisplay'
import styles from './Toolbar.module.css'

interface ToolbarProps {
  onLogin?: () => void
}

export function Toolbar({ onLogin }: ToolbarProps) {
  const { user, isAuthenticated, login, signup, logout } = useAuth()
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearNotifications,
  } = useNotifications()
  const { ipAddress, url } = useNetworkIP(4200)
  
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showNetworkMenu, setShowNetworkMenu] = useState(false)
  const [showSignUp, setShowSignUp] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const networkMenuRef = useRef<HTMLDivElement>(null)

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      if (accountMenuRef.current && !accountMenuRef.current.contains(target)) {
        setShowAccountMenu(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setShowNotifications(false)
      }
      if (networkMenuRef.current && !networkMenuRef.current.contains(target)) {
        setShowNetworkMenu(false)
      }
    }

    // Only add listener if any menu is open
    if (showAccountMenu || showNotifications || showNetworkMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAccountMenu, showNotifications, showNetworkMenu])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    setIsLoading(true)

    if (!username.trim() || !password.trim()) {
      setAuthError('Username and password are required')
      setIsLoading(false)
      return
    }

    const result = await login(username.trim(), password)

    if (result.success) {
      setUsername('')
      setPassword('')
      setShowSignUp(false)
      setShowAccountMenu(false)
      onLogin?.()
    } else {
      // If login fails with "Invalid username or password", check if user exists
      // If not, show sign up form
      if (result.error?.toLowerCase().includes('invalid') || result.error?.toLowerCase().includes('not found')) {
        setShowSignUp(true)
        setAuthError(null) // Clear error when switching to signup
      } else {
        setAuthError(result.error || 'Sign in failed')
      }
    }
    setIsLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    setIsLoading(true)

    if (!username.trim() || !password.trim()) {
      setAuthError('Username and password are required')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters')
      setIsLoading(false)
      return
    }

    const result = await signup(username.trim(), password)

    if (result.success) {
      setUsername('')
      setPassword('')
      setShowSignUp(false)
      setShowAccountMenu(false)
      onLogin?.()
    } else {
      setAuthError(result.error || 'Sign up failed')
    }
    setIsLoading(false)
  }

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id)
    if (notification.fileUrl) {
      window.open(notification.fileUrl, '_blank')
    } else if (notification.action) {
      notification.action.onClick()
    }
  }

  const handleDeleteNotification = (e: React.MouseEvent, id: string, filePath?: string) => {
    e.stopPropagation()
    if (filePath) {
      // Delete the file from backend
      fetch(`http://localhost:4202/api/files/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath }),
      }).catch(console.error)
    }
    deleteNotification(id)
  }

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarLeft}>
        <h1 className={styles.logo}>Assist</h1>
      </div>

      <div className={styles.toolbarRight}>
        {/* Network IP Dropdown */}
        <div className={styles.networkMenu} ref={networkMenuRef}>
          <button
            className={styles.networkButton}
            onClick={() => setShowNetworkMenu(!showNetworkMenu)}
            title="Network Access"
          >
            📶
          </button>
          {showNetworkMenu && (
            <div className={styles.networkDropdown}>
              <div className={styles.networkItem}>
                <strong>Local Access:</strong>
                <code className={styles.networkUrl}>http://localhost:4200</code>
              </div>
              <div className={styles.networkItem}>
                <strong>Network Access:</strong>
                <code className={styles.networkUrl}>{url}</code>
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className={styles.notificationsContainer} ref={notificationsRef}>
          <button
            className={styles.notificationButton}
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
          >
            🔔
            {unreadCount > 0 && (
              <span className={styles.notificationBadge}>{unreadCount}</span>
            )}
          </button>
          
          {showNotifications && (
            <div className={styles.notificationsDropdown}>
              <div className={styles.notificationsHeader}>
                <h3>Notifications</h3>
                <div className={styles.notificationsActions}>
                  {notifications.length > 0 && (
                    <>
                      <button
                        onClick={markAllAsRead}
                        className={styles.actionButton}
                        title="Mark all as read"
                      >
                        ✓ Read All
                      </button>
                      <button
                        onClick={clearNotifications}
                        className={styles.actionButton}
                        title="Clear all notifications"
                      >
                        🗑️ Clear
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              <div className={styles.notificationsList}>
                {notifications.length === 0 ? (
                  <div className={styles.emptyNotifications}>
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`${styles.notificationItem} ${!notification.read ? styles.unread : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className={styles.notificationContent}>
                        <div className={styles.notificationHeader}>
                          <span className={styles.notificationType}>
                            {notification.type === 'success' && '✅'}
                            {notification.type === 'warning' && '⚠️'}
                            {notification.type === 'error' && '❌'}
                            {notification.type === 'info' && 'ℹ️'}
                          </span>
                          <strong>{notification.title}</strong>
                          <button
                            className={styles.deleteButton}
                            onClick={(e) => handleDeleteNotification(e, notification.id, notification.filePath)}
                            title="Delete notification and file"
                          >
                            ×
                          </button>
                        </div>
                        <p>{notification.message}</p>
                        <span className={styles.notificationTime}>
                          {notification.timestamp.toLocaleString()}
                        </span>
                        {notification.fileUrl && (
                          <button
                            className={styles.downloadButton}
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(notification.fileUrl, '_blank')
                            }}
                          >
                            📥 Download
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Account Menu */}
        <div className={styles.accountContainer} ref={accountMenuRef}>
          <button
            className={styles.accountButton}
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            title={isAuthenticated ? user?.username || 'Account' : 'Login'}
          >
            {isAuthenticated ? (
              <>
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.username} className={styles.avatar} />
                ) : (
                  <span className={styles.avatarPlaceholder}>
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
                <span className={styles.username}>{user?.username || 'User'}</span>
              </>
            ) : (
              <span>👤 Login</span>
            )}
          </button>

          {showAccountMenu && (
            <div className={styles.accountDropdown}>
              {isAuthenticated ? (
                <>
                  <div className={styles.accountInfo}>
                    <div className={styles.accountName}>{user?.name || user?.username}</div>
                    <div className={styles.accountEmail}>{user?.email}</div>
                  </div>
                  <div className={styles.accountDivider}></div>
                  <button
                    className={styles.accountMenuItem}
                    onClick={() => {
                      setShowAccountMenu(false)
                      // Open settings modal or navigate to settings page
                      window.location.href = '/settings'
                    }}
                  >
                    ⚙️ Settings
                  </button>
                  <button
                    className={styles.accountMenuItem}
                    onClick={async () => {
                      await logout()
                      setShowAccountMenu(false)
                    }}
                  >
                    🚪 Logout
                  </button>
                </>
              ) : (
                <div className={styles.signInForm}>
                  <h3 className={styles.signInTitle}>
                    {showSignUp ? 'Sign Up' : 'Sign In'}
                  </h3>
                  
                  {authError && (
                    <ErrorDisplay
                      error={authError}
                      type="error"
                      onDismiss={() => setAuthError(null)}
                    />
                  )}
                  
                  <form onSubmit={showSignUp ? handleSignUp : handleSignIn}>
                    <div className={styles.formGroup}>
                      <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className={styles.formInput}
                        disabled={isLoading}
                        autoFocus
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={styles.formInput}
                        disabled={isLoading}
                      />
                    </div>
                    <button
                      type="submit"
                      className={styles.signInButton}
                      disabled={isLoading || !username.trim() || !password.trim()}
                    >
                      {isLoading ? '...' : (showSignUp ? 'Sign Up' : 'Sign In')}
                    </button>
                  </form>
                  
                  {!showSignUp && (
                    <button
                      className={styles.switchAuthButton}
                      onClick={() => {
                        setShowSignUp(true)
                        setAuthError(null)
                      }}
                    >
                      Need an account? Sign Up
                    </button>
                  )}
                  
                  {showSignUp && (
                    <button
                      className={styles.switchAuthButton}
                      onClick={() => {
                        setShowSignUp(false)
                        setAuthError(null)
                      }}
                    >
                      Already have an account? Sign In
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

