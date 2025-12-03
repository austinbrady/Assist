'use client'

import { useState, useRef, useEffect } from 'react'
import { AppPortConfig } from './AppCard'
import { useAuth } from '@/hooks/useAuth'
import styles from './ChatWindow.module.css'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  appSuggestion?: AppPortConfig
}

interface ChatWindowProps {
  selectedApp: AppPortConfig | null
  apps: AppPortConfig[]
  onNavigateToApp: (app: AppPortConfig | null) => void
  isMobile?: boolean
  onMenuClick?: () => void
}

const API_URL = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:4199'
const BACKEND_URL = 'http://localhost:4202'

// Store used greetings to ensure uniqueness
const usedGreetings = new Set<string>()

// Generate unique greeting
const generateGreeting = async (user: { username?: string; name?: string } | null, isAuthenticated: boolean): Promise<string> => {
  if (isAuthenticated && user) {
    // Personalized greeting for logged-in users
    const name = user.name || user.username || 'friend'
    const greetings = [
      `Hey ${name}! 👋 Ready to dive into some AI-powered productivity today?`,
      `Welcome back, ${name}! 🚀 What can Assist help you accomplish?`,
      `Good to see you again, ${name}! ✨ Let's make something amazing together.`,
      `Hello ${name}! 🌟 Your AI assistant is here and ready to assist.`,
      `Hi there, ${name}! 💫 What would you like to create or explore today?`,
      `Welcome, ${name}! 🎯 I'm here to help you achieve your goals.`,
      `Hey ${name}! 🎨 Let's turn your ideas into reality.`,
      `Greetings, ${name}! ⚡ Ready to supercharge your workflow?`,
      `Hello ${name}! 🎪 What exciting project are we working on today?`,
      `Hi ${name}! 🌈 Your personal AI assistant is at your service.`,
    ]
    
    // Filter out used greetings
    const available = greetings.filter(g => !usedGreetings.has(g))
    if (available.length === 0) {
      // Reset if all greetings used
      usedGreetings.clear()
      return greetings[Math.floor(Math.random() * greetings.length)]
    }
    
    const greeting = available[Math.floor(Math.random() * available.length)]
    usedGreetings.add(greeting)
    return greeting
  } else {
    // Generic but intelligent greeting for non-authenticated users
    const genericGreetings = [
      `Hello! I'm Assist, your AI assistant. I can help you manage applications, answer questions, and guide you to the right tools. How can I assist you today?`,
      `Welcome! I'm Assist, here to help you navigate your AI tools and answer any questions. What would you like to explore?`,
      `Hi there! I'm Assist, your intelligent assistant. I'm ready to help with app management, questions, or finding the right tools. What can I do for you?`,
      `Greetings! I'm Assist, an AI assistant designed to help you get the most out of your applications. How may I assist you?`,
      `Hello! I'm Assist, your helpful AI companion. I can manage apps, answer questions, and point you to the right resources. What would you like to do?`,
      `Welcome! I'm Assist, ready to help you navigate and utilize your AI tools effectively. How can I be of service?`,
      `Hi! I'm Assist, your AI assistant. I'm here to help with application management and answer your questions. What would you like to know?`,
      `Greetings! I'm Assist, an intelligent assistant ready to help you work more efficiently. How can I assist you today?`,
    ]
    
    const available = genericGreetings.filter(g => !usedGreetings.has(g))
    if (available.length === 0) {
      usedGreetings.clear()
      return genericGreetings[Math.floor(Math.random() * genericGreetings.length)]
    }
    
    const greeting = available[Math.floor(Math.random() * available.length)]
    usedGreetings.add(greeting)
    return greeting
  }
}

export function ChatWindow({ selectedApp, apps, onNavigateToApp, isMobile = false, onMenuClick }: ChatWindowProps) {
  const { user, isAuthenticated } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [greetingLoaded, setGreetingLoaded] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Load unique greeting on mount
  useEffect(() => {
    if (!greetingLoaded) {
      generateGreeting(user, isAuthenticated).then(greeting => {
        setMessages([{
          id: '1',
          role: 'assistant',
          content: greeting,
          timestamp: new Date(),
        }])
        setGreetingLoaded(true)
      })
    }
  }, [user, isAuthenticated, greetingLoaded])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const findAppInMessage = (message: string): AppPortConfig | null => {
    const lowerMessage = message.toLowerCase()
    for (const app of apps) {
      if (
        lowerMessage.includes(app.name.toLowerCase()) ||
        lowerMessage.includes(app.id.toLowerCase()) ||
        (app.description && lowerMessage.includes(app.description.toLowerCase().substring(0, 20)))
      ) {
        return app
      }
    }
    return null
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Get auth token if available
      const token = localStorage.getItem('assisant_ai_token')
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      // Try to send to PersonalAI backend chat endpoint
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: userMessage.content,
          conversation_id: 'hub-chat',
          username: user?.username,
        }),
      })

      let assistantContent = ''
      if (response.ok) {
        const data = await response.json()
        assistantContent = data.response || 'I received your message, but couldn\'t generate a response.'
      } else {
        const errorText = await response.text().catch(() => '')
        console.error('Chat API error:', response.status, errorText)
        if (response.status === 404) {
          assistantContent = 'The chat endpoint was not found. The PersonalAI backend may need to be restarted or the endpoint path may have changed.'
        } else if (response.status === 401) {
          assistantContent = 'Authentication required. Please make sure you are logged in to PersonalAI.'
        } else {
          assistantContent = `I'm having trouble connecting to the backend (status: ${response.status}). Make sure PersonalAI backend is running on port 4202.`
        }
      }

      // Check if the response mentions an app
      const suggestedApp = findAppInMessage(assistantContent)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
        appSuggestion: suggestedApp || undefined,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please make sure the PersonalAI backend is running on port 4202.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className={`${styles.chatWindow} ${isMobile ? styles.mobile : ''}`}>
      <div className={styles.chatHeader}>
        {isMobile && onMenuClick && (
          <button className={styles.menuButton} onClick={onMenuClick} aria-label="Open menu">
            ☰
          </button>
        )}
        <h2 className={styles.chatTitle}>
          {selectedApp ? `Chatting about ${selectedApp.name}` : 'AssisantAI Chat'}
        </h2>
        {selectedApp && (
          <button
            className={styles.clearButton}
            onClick={() => onNavigateToApp(null as any)}
          >
            Clear Selection
          </button>
        )}
      </div>

      <div className={styles.messagesContainer}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.message} ${styles[message.role]}`}
          >
            <div className={styles.messageContent}>
              <div className={styles.messageText}>{message.content}</div>
              {message.appSuggestion && (
                <div className={styles.appSuggestion}>
                  <p className={styles.suggestionText}>
                    Would you like to open <strong>{message.appSuggestion.name}</strong>?
                  </p>
                  <button
                    className={styles.navigateButton}
                    onClick={() => onNavigateToApp(message.appSuggestion!)}
                  >
                    Open {message.appSuggestion.name}
                  </button>
                </div>
              )}
            </div>
            <div className={styles.messageTime}>
              {message.timestamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        ))}
        {loading && (
          <div className={`${styles.message} ${styles.assistant}`}>
            <div className={styles.messageContent}>
              <div className={styles.typingIndicator}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className={styles.inputContainer}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className={styles.input}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className={styles.sendButton}
        >
          Send
        </button>
      </form>
    </div>
  )
}

