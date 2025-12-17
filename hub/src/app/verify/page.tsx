'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './verify.module.css'

interface LLMStatus {
  ollama: {
    connected: boolean
    url: string
    error?: string
    available_models?: string[]
  }
  gemini: {
    configured: boolean
    api_key_set: boolean
    api_key_valid?: boolean
    error?: string
  }
  timestamp: string
}

export default function VerifyPage() {
  const router = useRouter()
  const [status, setStatus] = useState<LLMStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Wait a bit for backend to be ready, then check with retries
    const timer = setTimeout(() => {
      checkLLMConnectionsWithRetry()
    }, 2000) // Wait 2 seconds for backend to start
    
    return () => clearTimeout(timer)
  }, [])

  const checkLLMConnectionsWithRetry = async (retries = 10) => {
    for (let i = 0; i < retries; i++) {
      try {
        setLoading(true)
        
        // Create timeout controller for fetch
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
        
        const response = await fetch('http://localhost:4202/api/verify/llm', {
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setStatus(data)
        setLoading(false)
        return // Success, exit retry loop
      } catch (err: any) {
        if (i === retries - 1) {
          // Last retry failed - set default status
          setStatus({
            ollama: {
              connected: false,
              url: 'http://localhost:11434',
              error: 'Backend not responding'
            },
            gemini: {
              configured: false,
              api_key_set: false,
              api_key_valid: false,
              error: 'Unable to check'
            },
            timestamp: new Date().toISOString()
          })
          setLoading(false)
        } else {
          // Wait before retrying - keep showing loading state
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
    }
  }

  const handleContinue = () => {
    router.push('/')
  }

  // Show loading screen while backend is loading
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.logo}>ASSIST</div>
        <div className={styles.loadingText}>
          <span className={styles.loadingDots}>backend is loading</span>
        </div>
      </div>
    )
  }

  // Show results once loaded
  if (status) {
    const ollamaConnected = status.ollama.connected
    const geminiConfigured = status.gemini.configured && status.gemini.api_key_valid

    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Step 7/7: LLM Connection Verification</h1>
          
          <div className={styles.statusGrid}>
            {/* Ollama Status */}
            <div className={styles.statusItem}>
              <div className={styles.statusIcon}>
                {ollamaConnected ? '✅' : '❌'}
              </div>
              <div className={styles.statusLabel}>Ollama</div>
            </div>

            {/* Gemini Status */}
            <div className={styles.statusItem}>
              <div className={styles.statusIcon}>
                {geminiConfigured ? '✅' : '❌'}
              </div>
              <div className={styles.statusLabel}>Gemini API</div>
            </div>
          </div>

          {/* Warning message if Gemini not configured */}
          {!geminiConfigured && (
            <div className={styles.geminiWarning}>
              <p>⚠️ Assist will STILL work without Gemini, but it will work better with it!</p>
            </div>
          )}

          {/* Continue Button */}
          <div className={styles.continueSection}>
            <button onClick={handleContinue} className={styles.continueButton}>
              Continue to Assist →
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

