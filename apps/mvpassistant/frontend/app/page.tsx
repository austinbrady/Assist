'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, User, LogIn, LogOut, Sparkles, Settings, Zap, CheckCircle, ArrowRight, Heart, Menu, X } from 'lucide-react'
import axios from 'axios'
import { getAuthToken, setAuthToken as setAuthTokenUtil, removeAuthToken } from '../utils/auth'

// Use environment variable for backend port, default to 4201 (AssistantAI assigned port)
const BACKEND_PORT = process.env.NEXT_PUBLIC_BACKEND_PORT || process.env.MVP_BACKEND_PORT || '4201'
const API_BASE_URL = typeof window !== 'undefined' 
  ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? `http://localhost:${BACKEND_PORT}`
      : `http://${window.location.hostname}:${BACKEND_PORT}`)
  : `http://localhost:${BACKEND_PORT}`

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showLogin, setShowLogin] = useState(true)
  const [showSignupForm, setShowSignupForm] = useState(false)
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [signupFirstName, setSignupFirstName] = useState('')
  const [signupLastName, setSignupLastName] = useState('')
  const [signupGender, setSignupGender] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [solutions, setSolutions] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`
    }
  }, [input])

  useEffect(() => {
    // Use unified token utility (checks URL param, localStorage with fallback)
    const token = getAuthToken()
    if (token) {
      setAuthToken(token)
      checkAuthStatus(token)
    } else {
      setShowLogin(true)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated && authToken) {
      loadUserData()
      loadSolutions()
      // Poll for new solutions every 3 seconds
      const interval = setInterval(() => {
        loadSolutions()
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated, authToken])

  const checkAuthStatus = async (token: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCurrentUser(response.data)
      setIsAuthenticated(true)
      setShowLogin(false)
      // Skip onboarding - everything happens in chat
    } catch (error) {
      removeAuthToken()
      setShowLogin(true)
    }
  }

  const loadUserData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      setCurrentUser(response.data)
    } catch (error) {
      console.error('Failed to load user data:', error)
    }
  }

  // Onboarding removed

  const handleSignup = async () => {
    // Validate required fields
    if (!signupFirstName.trim()) {
      alert('Please enter your first name')
      return
    }
    if (!signupLastName.trim()) {
      alert('Please enter your last name')
      return
    }
    if (!signupGender) {
      alert('Please select your gender')
      return
    }
    if (!signupPassword) {
      alert('Please enter a password')
      return
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/signup`, {
        first_name: signupFirstName.trim(),
        last_name: signupLastName.trim(),
        gender: signupGender,
        password: signupPassword
      })
      
      const token = response.data.token
      const username = response.data.user.username
      const backupData = response.data.backup_data
      
      // Prompt user to download backup file
      if (backupData) {
        const jsonStr = JSON.stringify(backupData, null, 2)
        const blob = new Blob([jsonStr], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${username}_backup.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        alert(`✅ Account created successfully!\n\n📥 Your backup file has been downloaded.\n\n⚠️ IMPORTANT: Keep this file secure! It contains your login credentials and cryptocurrency wallet private keys.\n\nYour username is: ${username}`)
      }
      
      setAuthTokenUtil(token)
      setAuthToken(token)
      setIsAuthenticated(true)
      setShowLogin(false)
      setShowSignupForm(false)
      
      // Auto-fill username for next login
      setLoginUsername(username)
      
      // Reset signup form
      setSignupFirstName('')
      setSignupLastName('')
      setSignupGender('')
      setSignupPassword('')
      // Skip onboarding - go straight to chat
    } catch (error: any) {
      console.error('Signup error:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Signup failed. Please try again.'
      alert(errorMessage)
    }
  }

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        username: loginUsername,
        password: loginPassword
      })
      
      const token = response.data.token
      setAuthTokenUtil(token)
      setAuthToken(token)
      setIsAuthenticated(true)
      setShowLogin(false)
      // Skip onboarding - go straight to chat
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Login failed')
    }
  }

  // Onboarding removed - everything happens in chat

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/chat`,
        {
          message: input,
          conversation_id: conversationId
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      
      let assistantContent = response.data.response
      
      // If a solution was created, enhance the message
      if (response.data.solution_created?.success) {
        assistantContent += "\n\n💝 I'm so excited to help you with this, Friend! Your solution is being created with all the features you need."
        loadSolutions()
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, assistantMessage])
      setConversationId(response.data.conversation_id)
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  const loadSolutions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/solutions`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      setSolutions(response.data.solutions || [])
    } catch (error) {
      console.error('Failed to load solutions:', error)
    }
  }

  const handleLogout = () => {
    removeAuthToken()
    setAuthToken(null)
    setIsAuthenticated(false)
    setShowLogin(true)
    setCurrentUser(null)
    setMessages([])
    setSkills([])
    setDashboardConfig(null)
  }

  // Login Screen
  if (showLogin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 sm:p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-gray-900 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">MVP Assistant</h1>
            <p className="text-gray-600 text-sm">Your personalized AI assistant</p>
          </div>
          
          {!showSignupForm ? (
            <div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-black"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-black"
                    placeholder="Enter your password"
                  />
                </div>
              </div>
              <button
                onClick={handleLogin}
                className="w-full mt-6 bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                Log In
              </button>
              <p className="text-center mt-4 text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => setShowSignupForm(true)}
                  className="text-gray-900 hover:underline font-medium"
                >
                  Sign up
                </button>
              </p>
            </div>
          ) : (
            <div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={signupFirstName}
                    onChange={(e) => setSignupFirstName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-black placeholder:text-gray-400"
                    placeholder="First Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={signupLastName}
                    onChange={(e) => setSignupLastName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-black placeholder:text-gray-400"
                    placeholder="Last Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={signupGender}
                    onChange={(e) => setSignupGender(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-black"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSignup()}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-black"
                    placeholder="Choose a password"
                  />
                </div>
              </div>
              <button
                onClick={handleSignup}
                className="w-full mt-6 bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                Sign Up
              </button>
              <p className="text-center mt-4 text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => setShowSignupForm(false)}
                  className="text-gray-900 hover:underline font-medium"
                >
                  Log in
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Onboarding removed - everything happens in chat

  // Detect mobile
  const [isMobile, setIsMobile] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setShowSidebar(true)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Main Dashboard - Clean 2-column layout
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3">
            {isMobile && (
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Toggle sidebar"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
            )}
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
              <h1 className="text-base sm:text-lg font-semibold text-gray-900">MVP Assistant</h1>
              <p className="text-xs text-gray-500">
                {currentUser?.first_name || 'Friend'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
        </div>
      </header>

      {/* Main Content - 2 Column Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {isMobile && showSidebar && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Left Sidebar - Solutions Library */}
        <div className={`${isMobile ? 'fixed left-0 top-0 bottom-0 z-50 transform transition-transform duration-300' : 'relative'} ${showSidebar ? 'translate-x-0' : isMobile ? '-translate-x-full' : ''} w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0`}>
          {isMobile && (
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Solutions</h2>
              <button
                onClick={() => setShowSidebar(false)}
                className="p-1 hover:bg-gray-100 rounded"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          )}
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">Solutions For You</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {solutions.length} {solutions.length === 1 ? 'solution' : 'solutions'}
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {solutions.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100 mb-3">
                  <Sparkles className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 font-medium mb-1">No solutions yet</p>
                <p className="text-xs text-gray-500">
                  Describe a problem in chat to start building
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {solutions.map((solution) => (
                  <div
                    key={solution.solution_id}
                    className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                        {solution.type === 'app' ? (
                          <Zap className="w-4 h-4 text-white" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {solution.type === 'script' ? 'Script' : 'App'}
                          </h4>
                          {solution.has_gui && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                              GUI
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2 mb-1.5">
                          {solution.problem || 'Solution'}
                        </p>
                        <span className="text-xs text-gray-400">
                          {new Date(solution.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Giant Chat Window */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Chat Header */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-sm sm:text-base font-semibold text-gray-900">Chat</h2>
              </div>
              
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gray-50">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 mt-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-gray-100 mb-3">
                      <Sparkles className="w-8 h-8 text-gray-600" />
                    </div>
                    <p className="text-lg font-semibold text-gray-900 mb-1">Hello, {currentUser?.first_name || 'Friend'}! 👋</p>
                    <p className="text-sm mb-4 text-gray-600">I'm here to help you solve any problem.</p>
                    <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-left">
                      <p className="text-xs font-semibold text-gray-900 mb-2">✨ Every solution I create includes:</p>
                      <div className="space-y-1.5 text-xs text-gray-600">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-900"></div>
                          <span>Beautiful GUI interface</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-900"></div>
                          <span>Full history tracking & logging</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-900"></div>
                          <span>Data visualization & projections</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-900"></div>
                          <span>Beautiful PDF & CSV exports</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {messages.map((msg, index) => {
                  const isUser = msg.role === 'user'
                  const showAvatar = index === 0 || messages[index - 1].role !== msg.role
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2 sm:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {/* Avatar */}
                      {showAvatar && (
                        <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                          isUser 
                            ? 'bg-gray-900' 
                            : 'bg-gray-700'
                        }`}>
                          {isUser ? (
                            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                          )}
                        </div>
                      )}
                      {!showAvatar && <div className="w-7 sm:w-8"></div>}
                      
                      {/* Message */}
                      <div className={`flex-1 ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1 max-w-[80%] sm:max-w-[75%]`}>
                        {showAvatar && (
                          <span className={`text-xs font-medium px-2 ${isUser ? 'text-right text-gray-500' : 'text-left text-gray-600'}`}>
                            {isUser ? 'You' : 'MVP Assistant'}
                          </span>
                        )}
                        <div
                          className={`rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 ${
                            isUser
                              ? 'bg-gray-900 text-white rounded-br-sm'
                              : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                          }`}
                        >
                          <div className={`text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${isUser ? 'text-white' : 'text-gray-800'}`}>
                            {msg.content}
                          </div>
                        </div>
                        <span className={`text-xs text-gray-400 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  )
                })}
                
                {loading && (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex items-center gap-2 bg-white rounded-lg rounded-bl-sm px-4 py-2.5 border border-gray-200">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                      <span className="text-sm text-gray-600">Thinking...</span>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
              
              {/* Chat Input */}
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-white flex-shrink-0">
                <div className="flex gap-2 sm:gap-3 items-end">
                  <div className="flex-1 relative">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      placeholder="Describe a problem you're facing..."
                      rows={1}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 pr-10 sm:pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-black resize-none overflow-hidden text-sm sm:text-base"
                      style={{ minHeight: '40px', maxHeight: '120px' }}
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || loading}
                    className="bg-gray-900 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-1 sm:gap-2 font-medium text-sm sm:text-base min-w-[60px] sm:min-w-[80px]"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="hidden sm:inline">Send</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

