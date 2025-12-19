'use client'

import { useState, useRef, useEffect } from 'react'
import { AppPortConfig } from './AppCard'
import { useAuth } from '@/hooks/useAuth'
import { useContextDetection } from '@/hooks/useContextDetection'
import styles from './ChatWindow.module.css'

interface MessageAction {
  label: string
  action: string
  data?: any
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  appSuggestion?: AppPortConfig
  attachments?: FileAttachment[]
  // Rich content types for backend execution results
  audioUrl?: string        // For songs, audio files
  fileUrl?: string         // For downloads (apps, documents)
  previewUrl?: string      // For app previews, email drafts
  actions?: MessageAction[] // For interactive buttons
  metadata?: any           // For structured data (tasks, emails, calls, etc.)
}

interface FileAttachment {
  file_id: string
  filename: string
  file_type: 'audio' | 'video' | 'image' | 'other'
  size: number
}

interface ChatWindowProps {
  selectedApp: AppPortConfig | null
  apps: AppPortConfig[]
  conversationId: string | null
  onNavigateToApp: (app: AppPortConfig | null) => void
  onNewConversationCreated?: (conversationId: string) => void
  isMobile?: boolean
  onMenuClick?: () => void
  deviceType?: 'iphone' | 'android' | 'ipad' | 'desktop' | 'unknown'
  deviceName?: string
  projectPath?: string
  selectedFile?: string
}

const API_URL = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:4199'
const BACKEND_URL = 'http://localhost:4202'

// Store used greetings to ensure uniqueness
const usedGreetings = new Set<string>()

// Generate unique greeting
const generateGreeting = async (user: { username?: string; name?: string } | null, isAuthenticated: boolean): Promise<string> => {
  if (isAuthenticated && user) {
    // For logged-in users, fetch their Character's name from the backend
    try {
      const token = localStorage.getItem('assisant_ai_token')
      const response = await fetch(`${BACKEND_URL}/api/character/greeting`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.greeting) {
          return data.greeting
        }
        // If Character name is available, use it
        if (data.character_name) {
          const characterName = data.character_name
          const userName = user.name || user.username || 'there'
          return `Hi ${userName}! I'm ${characterName}, your dedicated Character. I'm here to study you and make your life easier, better, and more effective. How can I help you today?`
        }
      }
    } catch (error) {
      console.error('Failed to fetch Character greeting:', error)
    }
    
    // Fallback: Personalized greeting (will be replaced by Character name once loaded)
    const name = user.name || user.username || 'friend'
    return `Hello ${name}! 👋 Your Character is loading...`
  } else {
    // Generic greeting for non-authenticated users - use "Assist" as the generic name
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

export function ChatWindow({ selectedApp, apps, conversationId, onNavigateToApp, onNewConversationCreated, isMobile = false, onMenuClick, deviceType, deviceName, projectPath, selectedFile }: ChatWindowProps) {
  const { user, isAuthenticated } = useAuth()
  const viewingContext = useContextDetection(isMobile ? 4000 : 2500) // Slower polling on mobile
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [attachments, setAttachments] = useState<FileAttachment[]>([])
  const [uploading, setUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const greetingInitialized = useRef(false)
  const lastAuthKey = useRef<string>('')
  const currentConversationId = useRef<string | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Load conversation history when conversationId changes
  useEffect(() => {
    if (conversationId && conversationId !== currentConversationId.current && isAuthenticated && user) {
      currentConversationId.current = conversationId
      setLoading(true)
      
      const token = localStorage.getItem('assisant_ai_token')
      fetch(`${BACKEND_URL}/api/conversations/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          if (data.messages && Array.isArray(data.messages)) {
            const loadedMessages: Message[] = data.messages.map((msg: any, index: number) => ({
              id: `${conversationId}-${index}`,
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.timestamp || Date.now()),
            }))
            setMessages(loadedMessages)
          } else {
            setMessages([])
          }
        })
        .catch(err => {
          console.error('Error loading conversation:', err)
          setMessages([])
        })
        .finally(() => {
          setLoading(false)
        })
    } else if (!conversationId && currentConversationId.current) {
      // New chat - clear messages and reset
      currentConversationId.current = null
      setMessages([])
      greetingInitialized.current = false
    }
  }, [conversationId, isAuthenticated, user])

  // Load unique greeting only when messages are empty and greeting hasn't been initialized
  useEffect(() => {
    // Track auth state changes to reset greeting initialization
    const currentAuthKey = `${user?.username || ''}-${isAuthenticated}`
    if (currentAuthKey !== lastAuthKey.current) {
      lastAuthKey.current = currentAuthKey
      greetingInitialized.current = false
    }

    // Only initialize greeting if messages array is empty (prevents wiping out user messages)
    // and we're not loading a conversation
    if (messages.length === 0 && !greetingInitialized.current && !conversationId && !loading) {
      greetingInitialized.current = true
      // Load greeting asynchronously
      generateGreeting(user, isAuthenticated).then(greeting => {
        // Double-check messages are still empty before setting (race condition protection)
        setMessages(prev => {
          if (prev.length === 0) {
            return [{
              id: '1',
              role: 'assistant',
              content: greeting,
              timestamp: new Date(),
            }]
          }
          return prev
        })
      })
    }
  }, [messages.length, user, isAuthenticated, conversationId, loading]) // Include messages.length to check when it becomes empty

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const token = localStorage.getItem('assisant_ai_token')
    const newAttachments: FileAttachment[] = []

    try {
      for (const file of Array.from(files)) {
        // Determine file type
        let fileType: 'audio' | 'video' | 'image' | 'other' = 'other'
        let uploadEndpoint = '/api/upload/audio'
        
        if (file.type.startsWith('audio/')) {
          fileType = 'audio'
          uploadEndpoint = '/api/upload/audio'
        } else if (file.type.startsWith('video/')) {
          fileType = 'video'
          uploadEndpoint = '/api/upload/video'
        } else if (file.type.startsWith('image/')) {
          fileType = 'image'
          uploadEndpoint = '/api/upload/image'
        }

        // Upload file
        const formData = new FormData()
        formData.append('file', file)

        const headers: HeadersInit = {}
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }

        const uploadResponse = await fetch(`${BACKEND_URL}${uploadEndpoint}`, {
          method: 'POST',
          headers,
          body: formData,
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          newAttachments.push({
            file_id: uploadData.file_id,
            filename: file.name,
            file_type: fileType,
            size: file.size,
          })
        } else {
          console.error(`Failed to upload ${file.name}:`, uploadResponse.statusText)
        }
      }

      setAttachments((prev) => [...prev, ...newAttachments])
    } catch (error) {
      console.error('Error uploading files:', error)
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeAttachment = (fileId: string) => {
    setAttachments((prev) => prev.filter((att) => att.file_id !== fileId))
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && attachments.length === 0) || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim() || (attachments.length > 0 ? `[Sent ${attachments.length} file(s)]` : ''),
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setAttachments([])
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

      // Generate conversation_id if this is a new chat (only after first message is sent)
      // Use existing conversationId if available, otherwise generate a new one
      const convId = conversationId || `hub-chat-${Date.now()}`

      // Try to send to PersonalAI backend chat endpoint
      // Include device information for device-aware responses
      // Include file attachments if any
      // Include project context if in ProjectMode
      const requestBody: any = {
        message: userMessage.content,
        conversation_id: convId,
        username: user?.username,
        attachments: attachments.length > 0 ? attachments.map(att => ({
          file_id: att.file_id,
          file_type: att.file_type,
          filename: att.filename,
        })) : undefined,
        device_info: {
          deviceType: deviceType || 'unknown',
          deviceName: deviceName || 'Unknown Device',
          isMobile: isMobile,
        },
      }

      // Add project context if in ProjectMode
      if (projectPath) {
        requestBody.project_context = {
          project_path: projectPath,
          selected_file: selectedFile,
        }
      }

      // Add viewing context (what user is currently viewing)
      requestBody.viewing_context = {
        page: viewingContext.page,
        formFields: viewingContext.formFields,
        filters: viewingContext.filters,
        videos: viewingContext.videos,
        content: viewingContext.content,
      }

      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      })

      let assistantContent = ''
      let returnedConversationId = convId
      if (response.ok) {
        const data = await response.json()
        assistantContent = data.response || 'I received your message, but couldn\'t generate a response.'
        // Update conversation ID if backend returned one (for new conversations)
        if (data.conversation_id && !conversationId) {
          returnedConversationId = data.conversation_id
          currentConversationId.current = returnedConversationId
          // Notify parent component about the new conversation
          if (onNewConversationCreated) {
            onNewConversationCreated(returnedConversationId)
          }
        }
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
              {message.attachments && message.attachments.length > 0 && (
                <div className={styles.attachments}>
                  {message.attachments.map((att) => (
                    <div key={att.file_id} className={styles.attachment}>
                      <span className={styles.attachmentIcon}>
                        {att.file_type === 'audio' ? '🎵' : att.file_type === 'video' ? '🎬' : att.file_type === 'image' ? '🖼️' : '📎'}
                      </span>
                      <span className={styles.attachmentName}>{att.filename}</span>
                      <span className={styles.attachmentSize}>
                        {(att.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  ))}
                </div>
              )}
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
        {attachments.length > 0 && (
          <div className={styles.attachmentsPreview}>
            {attachments.map((att) => (
              <div key={att.file_id} className={styles.attachmentPreview}>
                <span className={styles.attachmentPreviewIcon}>
                  {att.file_type === 'audio' ? '🎵' : att.file_type === 'video' ? '🎬' : att.file_type === 'image' ? '🖼️' : '📎'}
                </span>
                <span className={styles.attachmentPreviewName}>{att.filename}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.file_id)}
                  className={styles.attachmentRemove}
                  aria-label="Remove attachment"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div className={styles.inputWrapper}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*,video/*,image/*"
            onChange={handleFileSelect}
            className={styles.fileInput}
            id="file-upload"
            disabled={loading || uploading}
          />
          <label htmlFor="file-upload" className={styles.attachButton} title="Attach file">
            📎
          </label>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className={styles.input}
            disabled={loading || uploading}
          />
          <button
            type="submit"
            disabled={(!input.trim() && attachments.length === 0) || loading || uploading}
            className={styles.sendButton}
          >
            {uploading ? 'Uploading...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  )
}

