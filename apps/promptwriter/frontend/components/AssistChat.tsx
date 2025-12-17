'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './AssistChat.module.css'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AssistChatProps {
  onVariableUpdate?: (variables: Record<string, string>) => void
  currentVariables?: Record<string, string>
  conversationContext?: Array<{role: string, content: string}>
  availableFields?: Array<{key: string, label: string, type?: string, suggestions?: string[]}>
  pageContext?: string
}

const MIDDLEWARE_URL = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:4199'

export function AssistChat({ 
  onVariableUpdate, 
  currentVariables = {}, 
  conversationContext = [],
  availableFields = [],
  pageContext = 'Prompt Writer'
}: AssistChatProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize with a greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: "Hi! I'm Assist. I can help you fill out the music variables. For example, if you mention 'metalcore', I'll understand the genre, typical BPM, key, and other characteristics to suggest appropriate values.",
        timestamp: new Date(),
      }])
    }
  }, [messages.length])

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
    const userInputText = input.trim()
    setInput('')
    setLoading(true)

    try {
      const token = typeof window !== 'undefined' 
        ? (localStorage.getItem('assisant_ai_token') || localStorage.getItem('auth_token'))
        : null
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const chatHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
      chatHistory.push({ role: 'user', content: userInputText })

      // Build available fields description
      const fieldsDescription = availableFields.length > 0 
        ? `\nAvailable form fields to fill out:\n${availableFields.map(f => `- ${f.key} (${f.label})${f.suggestions ? ` - Common values: ${f.suggestions.slice(0, 5).join(', ')}` : ''}`).join('\n')}`
        : Object.keys(currentVariables).length > 0
        ? `\nAvailable form fields to fill out:\n${Object.keys(currentVariables).map(k => `- ${k}`).join('\n')}`
        : ''

      const contextPrompt = `You are Assist, an AI assistant helping a user fill out a form on the ${pageContext} page.

${fieldsDescription}

Current field values:
${Object.entries(currentVariables).filter(([_, v]) => v).map(([k, v]) => `- ${k}: ${v}`).join('\n') || 'None filled yet - all fields are empty'}

${conversationContext.length > 0 ? `\nPrevious conversation context:\n${conversationContext.map(m => `${m.role}: ${m.content}`).join('\n')}` : ''}

User is discussing: "${userInputText}"

Your task:
1. Understand what the user wants and provide a helpful response
2. Extract values from their message that match the available form fields
3. Automatically fill out the form fields based on what they say

When you mention field values in your response, use clear format like:
- ${availableFields.length > 0 ? availableFields.slice(0, 3).map(f => `${f.key}: [value]`).join('\n- ') : 'Field Name: [value]'}
- etc.

IMPORTANT: You can automatically fill out fields based on the user's description. For example:
- If they say "metalcore", extract: genre=Metalcore, BPM=160, vocalStyle=Screaming, energy=High
- If they say "pop song at 120 BPM in C major", extract: genre=Pop, bpm=120, key=C Major
- If they mention an artist or song, infer typical characteristics of that style

Be proactive - if you can infer field values from their message, mention them clearly in your response so the system can auto-fill the form.`

      let response
      try {
        response = await fetch(`${MIDDLEWARE_URL}/api/agent/message`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            message: contextPrompt,
            conversationHistory: chatHistory,
            context: {
              appId: 'promptwriter',
              purpose: 'variable_assistance',
              currentVariables
            }
          }),
        })
      } catch (fetchError: any) {
        // Network error - middleware not running or unreachable
        console.error('Fetch error:', fetchError)
        assistantContent = `I can't connect to the middleware server at ${MIDDLEWARE_URL}. Please make sure the middleware is running. You can start it by running "npm start" in the middleware directory, or check the start.sh script in the project root.`
        
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: assistantContent,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
        setLoading(false)
        inputRef.current?.focus()
        return
      }

      let assistantContent = ''
      if (response.ok) {
        const data = await response.json()
        assistantContent = data.response || 'I received your message, but couldn\'t generate a response.'
        
        // Extract variables from response - use available fields if provided, otherwise use common patterns
        const fieldKeys = availableFields.length > 0 
          ? availableFields.map(f => f.key)
          : Object.keys(currentVariables).length > 0 
          ? Object.keys(currentVariables)
          : ['genre', 'subGenre', 'bpm', 'key', 'era', 'vocalStyle', 'productionFX', 'instrumentation', 'energy', 'arrangement', 'dynamics']

        const extractedVariables: Record<string, string> = {}
        
        // Build patterns for all available fields
        const variablePatterns: Record<string, RegExp[]> = {}
        fieldKeys.forEach(key => {
          const patterns: RegExp[] = []
          // Pattern 1: "Field Name: value" or "Field-Name: value"
          const label = availableFields.find(f => f.key === key)?.label || key
          const labelVariations = [
            label,
            label.replace(/\s+/g, '[-\\s]+'),
            key,
            key.replace(/([A-Z])/g, '[-\\s]+$1').toLowerCase()
          ]
          labelVariations.forEach(lbl => {
            patterns.push(new RegExp(`${lbl}[:\\s]+([^\\n,\\.]+)`, 'i'))
          })
          // Pattern 2: key: value
          patterns.push(new RegExp(`${key}[:\\s]+([^\\n,\\.]+)`, 'i'))
          variablePatterns[key] = patterns
        })

        // Try to extract each variable
        fieldKeys.forEach(key => {
          const patterns = variablePatterns[key] || []
          for (const pattern of patterns) {
            const match = assistantContent.match(pattern)
            if (match && match[1]) {
              const value = match[1].trim()
              // Clean up the value (remove trailing punctuation if it's sentence-ending)
              const cleanValue = value.replace(/[.,;:]$/, '').trim()
              if (cleanValue && cleanValue.length > 0) {
                extractedVariables[key] = cleanValue
                break // Use first match found
              }
            }
          }
        })

        // Auto-fill the form if we extracted any variables
        if (Object.keys(extractedVariables).length > 0 && onVariableUpdate) {
          onVariableUpdate(extractedVariables)
        }
      } else {
        const errorText = await response.text().catch(() => '')
        console.error('Chat API error:', response.status, errorText)
        
        if (response.status === 0 || response.status === 503) {
          assistantContent = `I'm having trouble connecting to the middleware server. Please make sure the middleware is running on port 4199. You can start it by running "npm start" in the middleware directory.`
        } else if (response.status === 401) {
          assistantContent = `Authentication required. Please make sure you're logged in.`
        } else if (response.status === 404) {
          assistantContent = `The chat endpoint was not found. The middleware server may need to be restarted.`
        } else {
          assistantContent = `I'm having trouble connecting to Assist (Error ${response.status}). Please check that the middleware server is running on port 4199.`
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error connecting to Assist. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const isConsecutiveMessage = (index: number): boolean => {
    if (index === 0) return false
    return messages[index - 1].role === messages[index].role
  }

  // Facebook Messenger style - fixed at bottom, always visible when rendered
  return (
    <div className={styles.chatContainer}>
      {!isExpanded ? (
        <button
          className={styles.chatHead}
          onClick={() => setIsExpanded(true)}
          aria-label="Open chat with Assist"
        >
          <div className={styles.chatHeadAvatar}>
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <circle cx="28" cy="28" r="28" fill="#0084FF"/>
              <path d="M28 17c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 15c-4 0-12 2-12 6v3h24v-3c0-4-8-6-12-6z" fill="white"/>
            </svg>
          </div>
          <div className={styles.chatHeadBadge}>1</div>
        </button>
      ) : (
        <div className={styles.chatWindow}>
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <div className={styles.profileSection}>
                <div className={styles.avatar}>
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <circle cx="20" cy="20" r="20" fill="#0084FF"/>
                    <path d="M20 12c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 10c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="white"/>
                  </svg>
                </div>
                <div className={styles.profileInfo}>
                  <div className={styles.profileName}>Assist</div>
                  <div className={styles.profileStatus}>Active now</div>
                </div>
              </div>
              <button
                className={styles.minimizeBtn}
                onClick={() => setIsExpanded(false)}
                aria-label="Minimize"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 5l-5 5h3v5h4v-5h3l-5-5z" fill="#050505"/>
                </svg>
              </button>
            </div>
          </div>

          <div className={styles.messagesArea}>
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`${styles.messageRow} ${styles[message.role]} ${isConsecutiveMessage(index) ? styles.consecutive : ''}`}
              >
                <div className={styles.message}>
                  {message.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className={`${styles.messageRow} ${styles.assistant}`}>
                <div className={styles.message}>
                  <div className={styles.typing}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className={styles.composer}>
            <form onSubmit={sendMessage} className={styles.composerInner}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className={styles.input}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className={styles.sendBtn}
                aria-label="Send"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="white"/>
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
