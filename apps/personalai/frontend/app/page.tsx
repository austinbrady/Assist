'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Image as ImageIcon, Video, Loader2, Upload, X, Sparkles, Wand2, Film, History, Menu, ChevronDown, ChevronUp, Trash2, Music, Settings, Zap, User, Bitcoin, Download, RefreshCw, Folder, FolderOpen, Code, FilePlus, FileText, Clock, Bell, Play, Pause, Copy } from 'lucide-react'
import axios from 'axios'
import { getAuthToken, setAuthToken as setAuthTokenUtil, removeAuthToken } from '../utils/auth'

// Configure axios with longer timeout for slower connections
axios.defaults.timeout = 30000 // 30 seconds

// Suppress browser extension errors in console (they don't affect app functionality)
if (typeof window !== 'undefined') {
  const originalError = console.error
  console.error = (...args: unknown[]) => {
    const message = args.join(' ')
    // Filter out browser extension errors
    if (
      message.includes('chrome-extension://') ||
      message.includes('Sensilet') ||
      message.includes('Exodus') ||
      message.includes('Backpack') ||
      message.includes('Yours Wallet') ||
      message.includes('Cannot redefine property: solana') ||
      message.includes('Cannot redefine property: ethereum') ||
      message.includes('Denying load of chrome-extension://') ||
      message.includes('origins don\'t match') ||
      message.includes('Failed to fetch dynamically imported module: chrome-extension://') ||
      message.includes('__nextjs_original-stack-frame') ||
      message.includes('web_accessible_resources') ||
      message.includes('cannot be a descendant of') ||
      message.includes('hydration error')
    ) {
      // Silently ignore extension-related errors and hydration warnings
      return
    }
    // Log other errors normally
    originalError.apply(console, args)
  }
  
  // Also suppress extension warnings
  const originalWarn = console.warn
  console.warn = (...args: unknown[]) => {
    const message = args.join(' ')
    if (
      message.includes('chrome-extension://') ||
      message.includes('Sensilet') ||
      message.includes('React DevTools') ||
      message.includes('cannot be a descendant of') ||
      message.includes('hydration')
    ) {
      return
    }
    originalWarn.apply(console, args)
  }
}

// Enhanced device detection hook
function useDeviceDetection() {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  useEffect(() => {
    const checkDevice = () => {
      if (typeof window === 'undefined') return
      
      const width = window.innerWidth
      const userAgent = navigator.userAgent || navigator.vendor || (window as Window & { opera?: string }).opera || ''
      const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as Window & { MSStream?: unknown }).MSStream
      const isAndroid = /android/i.test(userAgent)
      
      // Mobile: < 768px
      // Tablet: 768px - 1024px
      // Desktop: > 1024px
      const mobileWidth = width < 768
      const tabletWidth = width >= 768 && width < 1024
      const isMobileDevice = (isIOS || isAndroid || mobileWidth) && !tabletWidth
      const isTabletDevice = tabletWidth || (isIOS && width >= 768)
      
      setIsMobile(isMobileDevice)
      setIsTablet(isTabletDevice)
      setDeviceType(isMobileDevice ? 'mobile' : isTabletDevice ? 'tablet' : 'desktop')
    }

    // Check immediately
    checkDevice()
    
    // Listen for resize events
    window.addEventListener('resize', checkDevice)
    window.addEventListener('orientationchange', checkDevice)
    
    return () => {
      window.removeEventListener('resize', checkDevice)
      window.removeEventListener('orientationchange', checkDevice)
    }
  }, [])

  return { isMobile, isTablet, deviceType }
}

// Auto-detect API URL: use current hostname for network access, fallback to localhost
// Use environment variable for backend port, default to 4202 (AssistantAI assigned port)
const BACKEND_PORT = process.env.NEXT_PUBLIC_BACKEND_PORT || process.env.PERSONALAI_BACKEND_PORT || '4202'
const API_BASE_URL = typeof window !== 'undefined' 
  ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? `http://localhost:${BACKEND_PORT}`
      : `http://${window.location.hostname}:${BACKEND_PORT}`)
  : `http://localhost:${BACKEND_PORT}`

// Utility function to capitalize username properly (first letter uppercase, rest lowercase)
function capitalizeUsername(username: string): string {
  if (!username) return username
  return username.charAt(0).toUpperCase() + username.slice(1).toLowerCase()
}

// Helper function to safely extract error message
function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    if ('response' in error && error.response && typeof error.response === 'object') {
      const response = error.response as { data?: ApiError }
      if (response.data?.detail) return response.data.detail
      if (response.data?.message) return response.data.message
    }
    if ('message' in error && typeof error.message === 'string') {
      return error.message
    }
  }
  return 'An unknown error occurred'
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  audioUrl?: string
  generatedImageIds?: string[]
}

interface UploadedFile {
  id: string
  type: 'image' | 'video'
  filename: string
  url: string
}

interface Conversation {
  conversation_id: string
  summary: string
  updated_at: string
  message_count: number
}

interface ImageFile {
  file_id: string
  filename: string
  size: number
  dimensions: { width: number; height: number }
  modified_at: string
  url: string
}

interface VideoFile {
  file_id: string
  filename: string
  size: number
  dimensions: { width: number; height: number }
  fps: number
  duration: number
  modified_at: string
  url: string
}

interface Song {
  song_id: string
  prompt: string
  for_fans_of?: string
  genre?: string
  mood?: string
  created_at: string
  audio_file?: string
}

interface OnboardingQuestion {
  id: string
  question: string
  type: string
  placeholder: string
}

interface Skill {
  id: string
  name: string
  description: string
  icon: string
  category: string
}

interface BSVInscription {
  id: string
  type: 'text' | 'file' | 'url' | 'document'
  content?: string
  file_id?: string
  url?: string
  txid?: string
  created_at: string
}

interface GalleryScanResult {
  total_images: number
  duplicates: number
  groups: Array<{
    hash: string
    images: Array<{
      path: string
      size: number
      modified: string
    }>
  }>
}

interface Assistant {
  id: string
  name: string
  description?: string
  biblical_reference?: string
  personality?: string
  color?: string
  icon?: string
  avatar_style?: string
}

interface RecentDocument {
  id: string
  skill_id: string
  filename: string
  path: string
  modified_at: string
  size: number
}

interface Project {
  id: string
  name: string
  description?: string
  status?: string
  created_at: string
  updated_at?: string
}

interface User {
  username: string
  assistant?: Assistant
  onboarding_complete: boolean
  profile?: {
    name?: string
    occupation?: string
    interests?: string
    goals?: string
    values?: string
    workflow?: string
    challenges?: string
    tools?: string
    communication?: string
    automation?: string
  }
}

interface Todo {
  id: string
  task: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  due_date?: string
  category?: string
  created_at: string
}

interface Expense {
  id: string
  amount: number
  category: string
  description: string
  date: string
  created_at?: string
}

interface Bill {
  id: string
  name: string
  amount: number
  due_date: string
  paid: boolean
  created_at?: string
}

interface Budget {
  income: number
  expenses: Expense[]
  categories?: { [key: string]: number }
}

interface MealPlan {
  id: string
  name: string
  date: string
  meals: string
  created_at: string
}

interface BusinessData {
  business_name: string
  revenue: number
  expenses: number
  profit: number
  customers?: Array<{
    name: string
    email?: string
    phone?: string
    address?: string
    notes?: string
  }>
  operating_hours?: { [key: string]: { open: string; close: string } }
}

interface Wallet {
  addresses?: {
    BTC?: { legacy: string }
    BCH?: { legacy: string }
    BSV?: { legacy: string }
    ETH?: string
  }
  ethereum?: {
    address: string
  }
}

interface SolanaWallet {
  address: string
  public_key: string
  created_at?: string
  imported?: boolean
}

interface WalletBalances {
  bitcoin: { btc: number; bch: number; bsv: number; usd: number }
  solana: { sol: number; usd: number }
  ethereum: { eth: number; base: number; usd: number; preferred_network?: string }
}

interface Token {
  symbol: string
  name: string
  balance: string
  decimals: number
  address?: string
}

interface NFT {
  name: string
  symbol?: string
  image?: string
  description?: string
  token_id?: string
  collection?: string
}

interface GalleryDuplicate {
  hash: string
  images: Array<{
    path: string
    size: number
    modified: string
  }>
}

interface CRMContact {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  notes?: string
  created_at: string
}

interface CRMDeal {
  id: string
  title: string
  value: number
  stage: string
  contact_id?: string
  created_at: string
}

interface CRMTask {
  id: string
  title: string
  description?: string
  due_date?: string
  completed: boolean
  contact_id?: string
  created_at: string
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  timestamp: string
  read: boolean
}

interface SongDetail {
  song_id: string
  prompt?: string
  filename?: string
  type?: 'uploaded' | 'generated' | 'rewrite' | 'cover' | 'alternative'
  lyrics?: string
  audio_file?: string
  midi_file?: string
  created_at: string
  audio_features?: {
    tempo?: number
    key?: string
    mode?: string
    genre?: string
    mood?: string
  }
}

interface ApiError {
  detail?: string
  message?: string
}

export default function Home(): React.ReactElement {
  const { isMobile, isTablet, deviceType } = useDeviceDetection()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null)
  const [editInstruction, setEditInstruction] = useState('')
  const [editing, setEditing] = useState(false)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [generatingVideo, setGeneratingVideo] = useState(false)
  const [generatingSong, setGeneratingSong] = useState(false)
  const [imagePrompt, setImagePrompt] = useState('')
  const [videoPrompt, setVideoPrompt] = useState('')
  const [songPrompt, setSongPrompt] = useState('')
  const [songForFansOf, setSongForFansOf] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [allConversations, setAllConversations] = useState<Conversation[]>([])
  const [displayedConversations, setDisplayedConversations] = useState<Conversation[]>([])
  const [conversationsDisplayLimit, setConversationsDisplayLimit] = useState(20)
  const conversationsScrollRef = useRef<HTMLDivElement>(null)
  const [imageHistory, setImageHistory] = useState<ImageFile[]>([])
  const [videoHistory, setVideoHistory] = useState<VideoFile[]>([])
  const [songHistory, setSongHistory] = useState<Song[]>([])
  const [uploadingSong, setUploadingSong] = useState(false)
  const songFileInputRef = useRef<HTMLInputElement>(null)
  const [showHistory, setShowHistory] = useState(false)
  // CRM state - using variables defined below
  // BSV Inscription state
  const [bsvInscriptions, setBsvInscriptions] = useState<BSVInscription[]>([])
  const [inscribingToBsv, setInscribingToBsv] = useState(false)
  // Gallery Cleaner state
  const [galleryScanResults, setGalleryScanResults] = useState<GalleryScanResult | null>(null)
  const [scanningGallery, setScanningGallery] = useState(false)
  const [selectedImagesToDelete, setSelectedImagesToDelete] = useState<string[]>([])
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    chat: false,
    images: false,
    videos: false,
    songs: false,
    skills: false,
    wallet: false,
    projects: false,
    settings: false,
    assistants: false
  })
  const [assistants, setAssistants] = useState<Assistant[]>([])
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([])
  const [showRecentDocuments, setShowRecentDocuments] = useState(false)
  const [recentDocumentsSkillId, setRecentDocumentsSkillId] = useState<string | null>(null)
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null)
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(null)
  const [assistantDescription, setAssistantDescription] = useState('')
  const [creatingAssistant, setCreatingAssistant] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [cursorApiKey, setCursorApiKey] = useState('')
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [activeView, setActiveView] = useState<string>('chat') // Track which main view is active
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [showLogin, setShowLogin] = useState(true)
  const [showSignupForm, setShowSignupForm] = useState(false) // Track if signup form should be shown
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [signupUsername, setSignupUsername] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingQuestions, setOnboardingQuestions] = useState<OnboardingQuestion[]>([])
  const [onboardingAnswers, setOnboardingAnswers] = useState<{ [key: string]: string }>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAssistantId, setSelectedAssistantId] = useState<string | null>(null)
  const [skills, setSkills] = useState<Skill[]>([])
  const [favoriteSkills, setFavoriteSkills] = useState<string[]>([])
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set())
  const [skillTask, setSkillTask] = useState('')
  const [skillIssueQuery, setSkillIssueQuery] = useState('')
  const [findingSkill, setFindingSkill] = useState(false)
  const [skillSuggestion, setSkillSuggestion] = useState<{ skill: Skill | null; message: string } | null>(null)
  const [currentSkillView, setCurrentSkillView] = useState<Skill | null>(null)
  const [avatarTalking, setAvatarTalking] = useState(false)
  const [avatarMessage, setAvatarMessage] = useState<string>('')
  const [showAvatar, setShowAvatar] = useState(true)
  const [executingSkill, setExecutingSkill] = useState(false)
  const [todos, setTodos] = useState<Todo[]>([])
  const [loadingTodos, setLoadingTodos] = useState(false)
  const [newTodoTask, setNewTodoTask] = useState('')
  const [newTodoPriority, setNewTodoPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [newTodoDueDate, setNewTodoDueDate] = useState('')
  const [editingTodo, setEditingTodo] = useState<string | null>(null)
  const [editTodoTask, setEditTodoTask] = useState('')
  const [editTodoPriority, setEditTodoPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [editTodoDueDate, setEditTodoDueDate] = useState('')
  const [editTodoCategory, setEditTodoCategory] = useState('')
  const [newTodoCategory, setNewTodoCategory] = useState('')
  const [todoFilter, setTodoFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [todoSort, setTodoSort] = useState<'date' | 'priority' | 'name'>('date')
  const [todoSearch, setTodoSearch] = useState('')
  // Things 3 Integration state
  const [things3Settings, setThings3Settings] = useState<{
    inbox_email?: string
    smtp_host?: string
    smtp_port?: number
    smtp_user?: string
    smtp_password?: string
    from_email?: string
    configured?: boolean
  }>({})
  const [showThings3Settings, setShowThings3Settings] = useState(false)
  const [testingThings3, setTestingThings3] = useState(false)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loadingExpenses, setLoadingExpenses] = useState(false)
  const [newExpenseAmount, setNewExpenseAmount] = useState('')
  const [newExpenseCategory, setNewExpenseCategory] = useState('')
  const [newExpenseDescription, setNewExpenseDescription] = useState('')
  const [bills, setBills] = useState<Bill[]>([])
  const [loadingBills, setLoadingBills] = useState(false)
  const [newBillName, setNewBillName] = useState('')
  const [newBillAmount, setNewBillAmount] = useState('')
  const [newBillDueDate, setNewBillDueDate] = useState('')
  const [budget, setBudget] = useState<Budget | null>(null)
  const [loadingBudget, setLoadingBudget] = useState(false)
  const [budgetIncome, setBudgetIncome] = useState('')
  const [newBudgetExpenseAmount, setNewBudgetExpenseAmount] = useState('')
  const [newBudgetExpenseCategory, setNewBudgetExpenseCategory] = useState('')
  const [newBudgetExpenseDescription, setNewBudgetExpenseDescription] = useState('')
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [loadingMealPlans, setLoadingMealPlans] = useState(false)
  const [newMealPlanName, setNewMealPlanName] = useState('')
  const [newMealPlanDate, setNewMealPlanDate] = useState('')
  const [newMealPlanMeals, setNewMealPlanMeals] = useState('')
  const [businessData, setBusinessData] = useState<BusinessData | null>(null)
  const [loadingBusiness, setLoadingBusiness] = useState(false)
  const [newBusinessExpenseAmount, setNewBusinessExpenseAmount] = useState('')
  const [newBusinessExpenseCategory, setNewBusinessExpenseCategory] = useState('')
  const [newBusinessExpenseDescription, setNewBusinessExpenseDescription] = useState('')
  const [newBusinessIncomeAmount, setNewBusinessIncomeAmount] = useState('')
  const [newBusinessIncomeSource, setNewBusinessIncomeSource] = useState('')
  const [newBusinessIncomeDescription, setNewBusinessIncomeDescription] = useState('')
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerEmail, setNewCustomerEmail] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  const [newCustomerAddress, setNewCustomerAddress] = useState('')
  const [newCustomerNotes, setNewCustomerNotes] = useState('')
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [solanaWallet, setSolanaWallet] = useState<SolanaWallet | null>(null)
  const [loadingWallet, setLoadingWallet] = useState(false)
  const [regeneratingWallet, setRegeneratingWallet] = useState(false)
  const [totalAccountValue, setTotalAccountValue] = useState<{ total_usd: number; breakdown: Record<string, number> } | null>(null)
  const [loadingTotalValue, setLoadingTotalValue] = useState(false)
  const [walletBalances, setWalletBalances] = useState<WalletBalances | null>(null)
  const [walletTab, setWalletTab] = useState<'wallets' | 'tokens' | 'nfts'>('wallets')
  const [walletTokens, setWalletTokens] = useState<Token[]>([])
  const [walletNfts, setWalletNfts] = useState<NFT[]>([])
  const [loadingTokens, setLoadingTokens] = useState(false)
  const [loadingNfts, setLoadingNfts] = useState(false)
  const [galleryDuplicates, setGalleryDuplicates] = useState<GalleryDuplicate[]>([])
  const [loadingGallery, setLoadingGallery] = useState(false)
  const [crmTab, setCrmTab] = useState<'contacts' | 'deals' | 'tasks'>('contacts')
  const [crmContacts, setCrmContacts] = useState<CRMContact[]>([])
  const [crmDeals, setCrmDeals] = useState<CRMDeal[]>([])
  const [crmTasks, setCrmTasks] = useState<CRMTask[]>([])
  const [loadingCRM, setLoadingCRM] = useState(false)
  const [loadingBalances, setLoadingBalances] = useState(false)
  const [balanceDisplayMode, setBalanceDisplayMode] = useState<{ [key: string]: 'usd' | 'native' }>({
    bitcoin: 'usd',
    solana: 'usd',
    ethereum: 'usd'
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const profilePictureInputRef = useRef<HTMLInputElement>(null)
  
  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  
  // Profile picture state
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [uploadingProfilePicture, setUploadingProfilePicture] = useState(false)
  
  // Progress log state
  interface ProgressLog {
    id: string
    type: 'image' | 'video' | 'song' | 'chat' | 'other'
    title: string
    status: 'pending' | 'in_progress' | 'completed' | 'error'
    progress: number
    message: string
    timestamp: Date
    details?: string
  }
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([])
  const [showProgressLogs, setShowProgressLogs] = useState(false)
  
  // Music player state
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [songDetails, setSongDetails] = useState<{ [key: string]: SongDetail }>({})
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({})

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Use unified token utility (checks URL param, localStorage with fallback)
    const token = getAuthToken()
    const storedUsername = localStorage.getItem('username')
    
    if (token) {
      // Ensure token is stored in localStorage (getAuthToken should have done this, but double-check)
      const storedToken = localStorage.getItem('assisant_ai_token')
      if (storedToken !== token) {
        console.log('[Auth] Storing token in localStorage from URL or fallback')
        setAuthTokenUtil(token)
      }
      
      setAuthToken(token)
      checkAuthStatus(token)
    } else {
      console.log('[Auth] No token found, showing login screen')
      setShowLogin(true)
      // Restore username if available (for convenience)
      if (storedUsername) {
        setLoginUsername(storedUsername)
      }
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated && !showOnboarding && authToken) {
      loadConversations()
      loadImageHistory()
      loadVideoHistory()
      loadSongHistory()
      loadSkills()
      loadWallet()
      loadSolanaWallet()
      loadWalletBalances()
      loadTotalAccountValue()
      loadAssistants()
      loadTodos()
    }
  }, [isAuthenticated, showOnboarding, authToken])

  // Load Solana wallet when solana view is active
  useEffect(() => {
    if (isAuthenticated && authToken && activeView === 'solana') {
      loadSolanaWallet()
    }
  }, [activeView, isAuthenticated, authToken])

  // Refresh balances every 30 seconds
  useEffect(() => {
    if (isAuthenticated && authToken) {
      const interval = setInterval(() => {
        loadWalletBalances()
      }, 30000) // 30 seconds
      return () => clearInterval(interval)
    }
  }, [isAuthenticated, authToken])

  // Update browser tab title with user's name
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isAuthenticated && currentUser?.profile?.name) {
        // Use the user's name from their profile
        document.title = `${currentUser.profile.name}'s Personal AI`
      } else if (isAuthenticated && currentUser?.username) {
        // Fallback to username if name not set yet
        document.title = `${capitalizeUsername(currentUser.username)}'s Personal AI`
      } else {
        // Default title
        document.title = 'Personal AI - Local AI Service'
      }
    }
  }, [isAuthenticated, currentUser])

  const loadSolanaWallet = async () => {
    if (!authToken) return
    setLoadingWallet(true)
    try {
      const response = await axios.get(`${API_BASE_URL}/api/wallet/solana`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      setSolanaWallet(response.data)
      
      // Also try to load tokens and NFTs
      try {
        const tokensRes = await axios.get(`${API_BASE_URL}/api/wallet/solana/tokens`, {
          headers: { Authorization: `Bearer ${authToken}` }
        })
        setWalletTokens(tokensRes.data.tokens || [])
      } catch (error) {
        console.error('Failed to load Solana tokens:', error)
      }
      
      try {
        const nftsRes = await axios.get(`${API_BASE_URL}/api/wallet/solana/nfts`, {
          headers: { Authorization: `Bearer ${authToken}` }
        })
        setWalletNfts(nftsRes.data.nfts || [])
      } catch (error) {
        console.error('Failed to load Solana NFTs:', error)
      }
    } catch (error) {
      console.error('Failed to load Solana wallet:', error)
      setSolanaWallet(null)
    } finally {
      setLoadingWallet(false)
    }
  }

  const loadWallet = async () => {
    if (!authToken) return
    
    setLoadingWallet(true)
    try {
      const response = await axios.get(`${API_BASE_URL}/api/wallet`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      console.log('Wallet loaded:', response.data)
      setWallet(response.data)
    } catch (error: unknown) {
      console.error('Failed to load wallet:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        console.error('Error details:', (error as { response?: { data?: unknown } }).response?.data)
      }
      setWallet(null)
    } finally {
      setLoadingWallet(false)
    }
  }

  const handleRegenerateWallet = async () => {
    if (!authToken) return
    
    if (!confirm('Are you sure you want to regenerate your wallet? This will create a new wallet and the old one will be lost!')) {
      return
    }
    
    setRegeneratingWallet(true)
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/wallet/regenerate`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      setWallet(response.data)
      alert('Wallet regenerated successfully!')
    } catch (error: unknown) {
      let errorMessage = 'Unknown error occurred'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as { response?: { data?: { detail?: string } } }
        errorMessage = axiosError.response?.data?.detail || 'Failed to regenerate wallet'
      }
      alert(`Failed to regenerate wallet: ${errorMessage}`)
    } finally {
      setRegeneratingWallet(false)
    }
  }

  const handleDownloadWallet = async () => {
    if (!authToken) return
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/wallet/download`, {
        headers: { Authorization: `Bearer ${authToken}` },
        responseType: 'blob'
      })
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      const username = currentUser?.username || 'wallet'
      link.setAttribute('download', `${capitalizeUsername(username)}_wallet.json`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error: unknown) {
      let errorMessage = 'Unknown error occurred'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as { response?: { data?: { detail?: string } } }
        errorMessage = axiosError.response?.data?.detail || 'Failed to download wallet'
      }
      alert(`Failed to download wallet: ${errorMessage}`)
    }
  }

  const loadTotalAccountValue = async () => {
    if (!authToken) return
    
    setLoadingTotalValue(true)
    try {
      const response = await axios.get(`${API_BASE_URL}/api/wallet/total-value`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      setTotalAccountValue(response.data)
    } catch (error: unknown) {
      console.error('Failed to load total account value:', error)
      setTotalAccountValue(null)
    } finally {
      setLoadingTotalValue(false)
    }
  }

  const loadWalletBalances = async () => {
    if (!authToken) return
    
    setLoadingBalances(true)
    try {
      const response = await axios.get(`${API_BASE_URL}/api/wallet/balances`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      setWalletBalances(response.data)
    } catch (error: unknown) {
      console.error('Failed to load wallet balances:', error)
      setWalletBalances(null)
    } finally {
      setLoadingBalances(false)
    }
  }

  const toggleBalanceDisplay = (walletType: string) => {
    setBalanceDisplayMode(prev => ({
      ...prev,
      [walletType]: prev[walletType] === 'usd' ? 'native' : 'usd'
    }))
  }

  const formatBalance = (walletType: string, balances: WalletBalances) => {
    if (!balances) return '$0.00'
    
    const mode = balanceDisplayMode[walletType] || 'usd'
    
    if (walletType === 'bitcoin') {
      if (mode === 'usd') {
        return `$${balances.bitcoin?.usd?.toFixed(2) || '0.00'}`
      } else {
        const total = (balances.bitcoin?.btc || 0) + (balances.bitcoin?.bch || 0) + (balances.bitcoin?.bsv || 0)
        return `${total.toFixed(8)} BTC`
      }
    } else if (walletType === 'solana') {
      if (mode === 'usd') {
        return `$${balances.solana?.usd?.toFixed(2) || '0.00'}`
      } else {
        return `${balances.solana?.sol?.toFixed(4) || '0.0000'} SOL`
      }
    } else if (walletType === 'ethereum') {
      if (mode === 'usd') {
        return `$${balances.ethereum?.usd?.toFixed(2) || '0.00'}`
      } else {
        return `${balances.ethereum?.eth?.toFixed(6) || '0.000000'} ETH`
      }
    }
    
    return '$0.00'
  }

  // Save progress logs to local storage
  const saveProgressLogsToStorage = (logs: ProgressLog[]) => {
    if (typeof window === 'undefined') return
    try {
      const logsData = logs.map(log => ({
        ...log,
        timestamp: log.timestamp.toISOString()
      }))
      localStorage.setItem('progressLogs', JSON.stringify(logsData))
    } catch (error) {
      console.error('Failed to save progress logs:', error)
    }
  }

  // Load progress logs from local storage
  const loadProgressLogsFromStorage = () => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem('progressLogs')
      if (stored) {
        const logs = (JSON.parse(stored) as Array<Record<string, unknown>>).map((log) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }))
        setProgressLogs(logs)
      }
    } catch (error) {
      console.error('Failed to load progress logs:', error)
    }
  }

  // Add or update progress log
  const addProgressLog = (log: Omit<ProgressLog, 'id' | 'timestamp'>) => {
    const newLog: ProgressLog = {
      ...log,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    }
    setProgressLogs(prev => {
      const updated = [...prev, newLog]
      saveProgressLogsToStorage(updated)
      return updated
    })
    return newLog.id
  }

  // Update progress log
  const updateProgressLog = (id: string, updates: Partial<ProgressLog>) => {
    setProgressLogs(prev => {
      const updated = prev.map(log => 
        log.id === id ? { ...log, ...updates } : log
      )
      saveProgressLogsToStorage(updated)
      return updated
    })
  }

  // Remove progress log
  const removeProgressLog = (id: string) => {
    setProgressLogs(prev => {
      const updated = prev.filter(log => log.id !== id)
      saveProgressLogsToStorage(updated)
      return updated
    })
  }

  // Load profile picture from local storage
  const loadProfilePicture = () => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem('profilePicture')
      if (stored) {
        setProfilePicture(stored)
      }
    } catch (error) {
      console.error('Failed to load profile picture:', error)
    }
  }

  // Handle profile picture upload
  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    setUploadingProfilePicture(true)
    const logId = addProgressLog({
      type: 'other',
      title: 'Uploading Profile Picture',
      status: 'in_progress',
      progress: 0,
      message: 'Uploading your profile picture...'
    })

    try {
      // Convert to base64 for local storage
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target?.result as string
        setProfilePicture(base64)
        localStorage.setItem('profilePicture', base64)
        updateProgressLog(logId, {
          status: 'completed',
          progress: 100,
          message: 'Profile picture uploaded successfully!'
        })
        setUploadingProfilePicture(false)
      }
      reader.onerror = () => {
        updateProgressLog(logId, {
          status: 'error',
          progress: 0,
          message: 'Failed to upload profile picture'
        })
        setUploadingProfilePicture(false)
        alert('Failed to upload profile picture')
      }
      reader.readAsDataURL(file)
    } catch (error: unknown) {
      updateProgressLog(logId, {
        status: 'error',
        progress: 0,
        message: `Error: ${getErrorMessage(error)}`
      })
      setUploadingProfilePicture(false)
      alert(`Error uploading profile picture: ${getErrorMessage(error)}`)
    }
  }

  // Load progress logs on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadProgressLogsFromStorage()
      loadProfilePicture()
    }
  }, [])

  const checkAuthStatus = async (token: string) => {
    // Validate token exists before making API call
    if (!token || token.trim() === '') {
      console.error('[Auth] No token provided to checkAuthStatus')
      setShowLogin(true)
      return
    }

    try {
      console.log('[Auth] Checking authentication status...', { 
        tokenLength: token.length,
        apiUrl: `${API_BASE_URL}/api/auth/me`
      })
      
      const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      console.log('[Auth] Authentication successful', { username: response.data.username })
      
      // Update stored username if it changed (case correction)
      if (response.data.username) {
        localStorage.setItem('username', response.data.username)
      }
      
      setCurrentUser(response.data)
      setIsAuthenticated(true)
      setShowLogin(false)
      
      // Update tab title with user's name if available
      if (response.data.profile?.name) {
        document.title = `${response.data.profile.name}'s Personal AI`
      } else if (response.data.username) {
        document.title = `${capitalizeUsername(response.data.username)}'s Personal AI`
      }
      
      // NEVER show onboarding on page load or login - only after signup
      // Onboarding is handled in handleSignup() after successful account creation
      // This ensures each user's Personal AI is private and personalized only for them
    } catch (error: any) {
      // Distinguish between network errors and authentication errors
      const isNetworkError = !error.response || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK'
      const isAuthError = error.response?.status === 401 || error.response?.status === 403
      
      if (isNetworkError) {
        console.error('[Auth] Network error during authentication check:', {
          message: error.message,
          code: error.code,
          apiUrl: `${API_BASE_URL}/api/auth/me`
        })
        // Don't clear token on network errors - might be temporary
        // Just show login but keep token for retry
        setShowLogin(true)
        setIsAuthenticated(false)
        document.title = 'Personal AI - Local AI Service'
      } else if (isAuthError) {
        console.error('[Auth] Authentication failed - invalid or expired token:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          detail: error.response?.data?.detail
        })
        // Token is invalid or expired, clear all auth data
        removeAuthToken()
        localStorage.removeItem('username')
        setAuthToken(null)
        setIsAuthenticated(false)
        setShowLogin(true)
        document.title = 'Personal AI - Local AI Service'
      } else {
        console.error('[Auth] Unexpected error during authentication check:', {
          status: error.response?.status,
          message: error.message,
          data: error.response?.data
        })
        // For other errors, clear token to be safe
        removeAuthToken()
        localStorage.removeItem('username')
        setAuthToken(null)
        setIsAuthenticated(false)
        setShowLogin(true)
        document.title = 'Personal AI - Local AI Service'
      }
    }
  }

  const loadOnboardingQuestions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/onboarding-questions`)
      setOnboardingQuestions(response.data.questions)
      // Also load assistants for selection
      const assistantsResponse = await axios.get(`${API_BASE_URL}/api/auth/assistants`)
      setAssistants(assistantsResponse.data.assistants)
    } catch (error) {
      console.error('Failed to load onboarding questions:', error)
    }
  }

  const loadSkills = async () => {
    if (!authToken) return
    try {
      const response = await axios.get(`${API_BASE_URL}/api/skills`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      setSkills(response.data.skills || [])
      
      // Load favorite skills
      const favoritesResponse = await axios.get(`${API_BASE_URL}/api/skills/favorites`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      setFavoriteSkills(favoritesResponse.data.favorites || [])
    } catch (error) {
      // Silently fail - skills might not be available yet
    }
  }

  const loadAssistants = async () => {
    if (!authToken) return
    try {
      const response = await axios.get(`${API_BASE_URL}/api/assistants`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      setAssistants(response.data.assistants || [])
    } catch (error) {
      console.error('Failed to load assistants:', error)
    }
  }

  const createAssistant = async () => {
    if (!authToken || !assistantDescription.trim()) return
    
    setCreatingAssistant(true)
    try {
      const response = await axios.post(`${API_BASE_URL}/api/assistants/create-chat`, {
        description: assistantDescription
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      
      // Create a message showing the assistant creation started
      const message: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `🚀 **Assistant Creation Started**\n\n${response.data.message}\n\nSession ID: ${response.data.session_id}\n\nI'll help you build this automation step by step. Let's get started!`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, message])
      setAssistantDescription('')
      setCreatingAssistant(false)
      // Switch to chat view to see the conversation
      setActiveView('chat')
    } catch (error: unknown) {
      alert(`Failed to create assistant: ${getErrorMessage(error)}`)
      setCreatingAssistant(false)
    }
  }

  const toggleFavoriteSkill = async (skillId: string) => {
    if (!authToken) return
    
    try {
      const isFavorite = favoriteSkills.includes(skillId)
      const newFavorites = isFavorite
        ? favoriteSkills.filter(id => id !== skillId)
        : [...favoriteSkills, skillId]
      
      await axios.post(`${API_BASE_URL}/api/skills/favorites`, {
        skill_id: skillId,
        is_favorite: !isFavorite
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      
      setFavoriteSkills(newFavorites)
    } catch (error) {
      console.error('Failed to update favorite skill:', error)
    }
  }

  const loadTodos = async () => {
    if (!authToken) return
    setLoadingTodos(true)
    try {
      const response = await axios.get(`${API_BASE_URL}/api/skills/todo_list/data`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      setTodos(response.data.data || [])
    } catch (error) {
      console.error('Failed to load todos:', error)
      setTodos([])
    } finally {
      setLoadingTodos(false)
    }
  }

  const addTodo = async () => {
    if (!authToken || !newTodoTask.trim()) return
    
    const logId = addProgressLog({
      type: 'other',
      title: 'Adding Task',
      status: 'in_progress',
      progress: 0,
      message: `Adding task: "${newTodoTask}"`
    })
    
    try {
      updateProgressLog(logId, { progress: 50, message: 'Saving task...' })
      const response = await axios.post(
        `${API_BASE_URL}/api/skills/execute`,
        {
          skill_id: 'todo_list',
          task: `add ${newTodoTask}`,
          parameters: { 
            task: newTodoTask,
            priority: newTodoPriority,
            due_date: newTodoDueDate || undefined
          }
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      
      const taskText = newTodoTask
      setNewTodoTask('')
      setNewTodoPriority('medium')
      setNewTodoDueDate('')
      setNewTodoCategory('')
      await loadTodos() // Reload todos
      
      updateProgressLog(logId, {
        status: 'completed',
        progress: 100,
        message: `Task added successfully!`
      })
      
      // Show success message
      const resultMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ Task added: "${taskText}"`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, resultMessage])
    } catch (error: unknown) {
      updateProgressLog(logId, {
        status: 'error',
        progress: 0,
        message: `Failed to add task: ${getErrorMessage(error)}`
      })
      alert(`Failed to add task: ${getErrorMessage(error)}`)
    }
  }

  const editTodo = async (todoId: string) => {
    if (!authToken || !editTodoTask.trim()) return
    
    const logId = addProgressLog({
      type: 'other',
      title: 'Updating Task',
      status: 'in_progress',
      progress: 0,
      message: `Updating task...`
    })
    
    try {
      updateProgressLog(logId, { progress: 50, message: 'Saving changes...' })
      await axios.post(
        `${API_BASE_URL}/api/skills/execute`,
        {
          skill_id: 'todo_list',
          task: 'update',
          parameters: { 
            todo_id: todoId,
            task: editTodoTask,
            priority: editTodoPriority,
            due_date: editTodoDueDate || undefined,
            category: editTodoCategory || undefined
          }
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      setEditingTodo(null)
      setEditTodoTask('')
      setEditTodoPriority('medium')
      setEditTodoDueDate('')
      setEditTodoCategory('')
      await loadTodos()
      
      updateProgressLog(logId, {
        status: 'completed',
        progress: 100,
        message: `Task updated successfully!`
      })
    } catch (error: unknown) {
      updateProgressLog(logId, {
        status: 'error',
        progress: 0,
        message: `Failed to update task: ${getErrorMessage(error)}`
      })
      alert(`Failed to update task: ${getErrorMessage(error)}`)
    }
  }

  const startEditTodo = (todo: Todo) => {
    setEditingTodo(todo.id)
    setEditTodoTask(todo.task)
    setEditTodoPriority(todo.priority || 'medium')
    setEditTodoDueDate(todo.due_date || '')
    setEditTodoCategory(todo.category || '')
  }

  const cancelEditTodo = () => {
    setEditingTodo(null)
    setEditTodoTask('')
    setEditTodoPriority('medium')
    setEditTodoDueDate('')
    setEditTodoCategory('')
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-[#86868b] bg-[#f5f5f7] border-[#e8e8ed]'
    }
  }

  const loadThings3Settings = async () => {
    if (!authToken) return
    try {
      const response = await axios.get(`${API_BASE_URL}/api/things3/settings`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      setThings3Settings(response.data)
    } catch (error: unknown) {
      console.error('Failed to load Things 3 settings:', error)
    }
  }

  const saveThings3Settings = async () => {
    if (!authToken) return
    try {
      await axios.post(`${API_BASE_URL}/api/things3/settings`, things3Settings, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      await loadThings3Settings()
      alert('Things 3 settings saved successfully!')
    } catch (error: unknown) {
      alert(`Failed to save Things 3 settings: ${getErrorMessage(error)}`)
    }
  }

  const testThings3Connection = async () => {
    if (!authToken) return
    setTestingThings3(true)
    try {
      const response = await axios.post(`${API_BASE_URL}/api/things3/test`, {}, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      if (response.data.success) {
        alert('✓ Test task sent to Things 3 successfully! Check your Things 3 inbox.')
      } else {
        alert(`Test failed: ${response.data.error || 'Unknown error'}`)
      }
    } catch (error: unknown) {
      alert(`Test failed: ${getErrorMessage(error)}`)
    } finally {
      setTestingThings3(false)
    }
  }

  const getFilteredAndSortedTodos = () => {
    let filtered = todos
    
    // Apply search filter
    if (todoSearch.trim()) {
      filtered = filtered.filter(t => 
        t.task.toLowerCase().includes(todoSearch.toLowerCase()) ||
        (t.category && t.category.toLowerCase().includes(todoSearch.toLowerCase()))
      )
    }
    
    // Apply status filter
    if (todoFilter === 'pending') {
      filtered = filtered.filter(t => !t.completed)
    } else if (todoFilter === 'completed') {
      filtered = filtered.filter(t => t.completed)
    }
    
    // Apply sort
    const sorted = [...filtered].sort((a, b) => {
      if (todoSort === 'priority') {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0
        return bPriority - aPriority
      } else if (todoSort === 'name') {
        return a.task.localeCompare(b.task)
      } else { // date
        const aDate = new Date(a.created_at || 0).getTime()
        const bDate = new Date(b.created_at || 0).getTime()
        return bDate - aDate
      }
    })
    
    return sorted
  }

  const toggleTodoComplete = async (todoId: string) => {
    if (!authToken) return
    
    const todo = todos.find(t => t.id === todoId)
    const isCompleting = !todo?.completed
    
    const logId = addProgressLog({
      type: 'other',
      title: isCompleting ? 'Completing Task' : 'Reopening Task',
      status: 'in_progress',
      progress: 0,
      message: isCompleting ? 'Marking task as completed...' : 'Reopening task...'
    })
    
    try {
      updateProgressLog(logId, { progress: 50, message: 'Updating task status...' })
      await axios.post(
        `${API_BASE_URL}/api/skills/execute`,
        {
          skill_id: 'todo_list',
          task: 'complete',
          parameters: { todo_id: todoId }
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      await loadTodos() // Reload todos
      
      updateProgressLog(logId, {
        status: 'completed',
        progress: 100,
        message: isCompleting ? 'Task completed!' : 'Task reopened!'
      })
    } catch (error: unknown) {
      updateProgressLog(logId, {
        status: 'error',
        progress: 0,
        message: `Failed to update task: ${getErrorMessage(error)}`
      })
      alert(`Failed to update task: ${getErrorMessage(error)}`)
    }
  }

  const deleteTodo = async (todoId: string) => {
    if (!authToken) return
    
    if (!confirm('Delete this task?')) return
    
    const logId = addProgressLog({
      type: 'other',
      title: 'Deleting Task',
      status: 'in_progress',
      progress: 0,
      message: 'Deleting task...'
    })
    
    try {
      updateProgressLog(logId, { progress: 50, message: 'Removing task...' })
      await axios.post(
        `${API_BASE_URL}/api/skills/execute`,
        {
          skill_id: 'todo_list',
          task: 'delete',
          parameters: { todo_id: todoId }
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      await loadTodos() // Reload todos
      
      updateProgressLog(logId, {
        status: 'completed',
        progress: 100,
        message: 'Task deleted successfully!'
      })
    } catch (error: unknown) {
      alert(`Failed to delete task: ${getErrorMessage(error)}`)
    }
  }

  const loadExpenses = async () => {
    if (!authToken) return
    setLoadingExpenses(true)
    try {
      const response = await axios.get(`${API_BASE_URL}/api/skills/expense_calculator/data`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      setExpenses(response.data.data || [])
    } catch (error) {
      console.error('Failed to load expenses:', error)
      setExpenses([])
    } finally {
      setLoadingExpenses(false)
    }
  }

  const loadBusiness = async () => {
    if (!authToken) return
    setLoadingBusiness(true)
    try {
      const response = await axios.get(`${API_BASE_URL}/api/skills/business_manager/data`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      setBusinessData(response.data.data || null)
      
      // Also load dashboard summary
      const dashboardResponse = await axios.post(
        `${API_BASE_URL}/api/skills/execute`,
        {
          skill_id: 'business_manager',
          task: 'dashboard',
          parameters: {}
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      // Update business data with dashboard summary
      if (dashboardResponse.data) {
        setBusinessData((prev: BusinessData | null) => ({
          ...prev,
          ...dashboardResponse.data
        }))
      }
    } catch (error) {
      console.error('Failed to load business data:', error)
      setBusinessData(null)
    } finally {
      setLoadingBusiness(false)
    }
  }

  const addExpense = async () => {
    if (!authToken || !newExpenseAmount.trim() || !newExpenseCategory.trim()) return
    
    try {
      await axios.post(
        `${API_BASE_URL}/api/skills/execute`,
        {
          skill_id: 'expense_calculator',
          task: `add expense`,
          parameters: {
            amount: parseFloat(newExpenseAmount),
            category: newExpenseCategory,
            description: newExpenseDescription
          }
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      setNewExpenseAmount('')
      setNewExpenseCategory('')
      setNewExpenseDescription('')
      await loadExpenses()
      
      const resultMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ Expense added: $${newExpenseAmount} in ${newExpenseCategory}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, resultMessage])
    } catch (error: unknown) {
      alert(`Failed to add expense: ${getErrorMessage(error)}`)
    }
  }

  const deleteExpense = async (expenseId: string) => {
    if (!authToken) return
    
    if (!confirm('Are you sure you want to delete this expense?')) return
    
    try {
      await axios.post(
        `${API_BASE_URL}/api/skills/execute`,
        {
          skill_id: 'expense_calculator',
          task: `delete expense`,
          parameters: {
            expense_id: expenseId
          }
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      await loadExpenses()
    } catch (error: unknown) {
      alert(`Failed to delete expense: ${getErrorMessage(error)}`)
    }
  }

  const calculateTotal = () => {
    return expenses.reduce((sum: number, e: Expense) => sum + (e.amount || 0), 0)
  }

  const calculateByCategory = () => {
    const categoryTotals: { [key: string]: number } = {}
    expenses.forEach((e: Expense) => {
      const cat = e.category || 'other'
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (e.amount || 0)
    })
    return categoryTotals
  }

  const addBusinessExpense = async () => {
    if (!authToken || !newBusinessExpenseAmount.trim() || !newBusinessExpenseCategory.trim()) return
    
    try {
      await axios.post(
        `${API_BASE_URL}/api/skills/execute`,
        {
          skill_id: 'business_manager',
          task: 'add expense',
          parameters: {
            amount: parseFloat(newBusinessExpenseAmount),
            category: newBusinessExpenseCategory,
            description: newBusinessExpenseDescription
          }
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      setNewBusinessExpenseAmount('')
      setNewBusinessExpenseCategory('')
      setNewBusinessExpenseDescription('')
      await loadBusiness()
    } catch (error: unknown) {
      alert(`Failed to add expense: ${getErrorMessage(error)}`)
    }
  }

  const addBusinessIncome = async () => {
    if (!authToken || !newBusinessIncomeAmount.trim() || !newBusinessIncomeSource.trim()) return
    
    try {
      await axios.post(
        `${API_BASE_URL}/api/skills/execute`,
        {
          skill_id: 'business_manager',
          task: 'add income',
          parameters: {
            amount: parseFloat(newBusinessIncomeAmount),
            source: newBusinessIncomeSource,
            description: newBusinessIncomeDescription
          }
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      setNewBusinessIncomeAmount('')
      setNewBusinessIncomeSource('')
      setNewBusinessIncomeDescription('')
      await loadBusiness()
    } catch (error: unknown) {
      alert(`Failed to add income: ${getErrorMessage(error)}`)
    }
  }

  const addBusinessCustomer = async () => {
    if (!authToken || !newCustomerName.trim()) return
    
    try {
      await axios.post(
        `${API_BASE_URL}/api/skills/execute`,
        {
          skill_id: 'business_manager',
          task: 'add customer',
          parameters: {
            name: newCustomerName,
            email: newCustomerEmail,
            phone: newCustomerPhone,
            address: newCustomerAddress,
            notes: newCustomerNotes
          }
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      setNewCustomerName('')
      setNewCustomerEmail('')
      setNewCustomerPhone('')
      setNewCustomerAddress('')
      setNewCustomerNotes('')
      await loadBusiness()
    } catch (error: unknown) {
      alert(`Failed to add customer: ${getErrorMessage(error)}`)
    }
  }

  const deleteBusinessExpense = async (expenseId: string) => {
    if (!authToken) return
    if (!confirm('Are you sure you want to delete this expense?')) return
    
    try {
      await axios.post(
        `${API_BASE_URL}/api/skills/execute`,
        {
          skill_id: 'business_manager',
          task: 'delete expense',
          parameters: { expense_id: expenseId }
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      await loadBusiness()
    } catch (error: unknown) {
      alert(`Failed to delete expense: ${getErrorMessage(error)}`)
    }
  }

  const deleteBusinessIncome = async (incomeId: string) => {
    if (!authToken) return
    if (!confirm('Are you sure you want to delete this income?')) return
    
    try {
      await axios.post(
        `${API_BASE_URL}/api/skills/execute`,
        {
          skill_id: 'business_manager',
          task: 'delete income',
          parameters: { income_id: incomeId }
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      await loadBusiness()
    } catch (error: unknown) {
      alert(`Failed to delete income: ${getErrorMessage(error)}`)
    }
  }

  const deleteBusinessCustomer = async (customerId: string) => {
    if (!authToken) return
    if (!confirm('Are you sure you want to delete this customer?')) return
    
    try {
      await axios.post(
        `${API_BASE_URL}/api/skills/execute`,
        {
          skill_id: 'business_manager',
          task: 'delete customer',
          parameters: { customer_id: customerId }
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      await loadBusiness()
    } catch (error: unknown) {
      alert(`Failed to delete customer: ${getErrorMessage(error)}`)
    }
  }

  const loadBills = async () => {
    if (!authToken) return
    setLoadingBills(true)
    try {
      const response = await axios.get(`${API_BASE_URL}/api/skills/bills/data`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      setBills(response.data.data || [])
    } catch (error) {
      console.error('Failed to load bills:', error)
      setBills([])
    } finally {
      setLoadingBills(false)
    }
  }

  const addBill = async () => {
    if (!authToken || !newBillName.trim() || !newBillAmount.trim()) return
    
    try {
      await axios.post(
        `${API_BASE_URL}/api/skills/execute`,
        {
          skill_id: 'bills',
          task: `add bill`,
          parameters: {
            name: newBillName,
            amount: parseFloat(newBillAmount),
            due_date: newBillDueDate || undefined
          }
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      setNewBillName('')
      setNewBillAmount('')
      setNewBillDueDate('')
      await loadBills()
    } catch (error: unknown) {
      alert(`Failed to add bill: ${getErrorMessage(error)}`)
    }
  }

  const markBillPaid = async (billId: string) => {
    if (!authToken) return
    
    try {
      await axios.post(
        `${API_BASE_URL}/api/skills/execute`,
        {
          skill_id: 'bills',
          task: 'pay',
          parameters: { bill_id: billId }
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      await loadBills()
    } catch (error: unknown) {
      alert(`Failed to mark bill as paid: ${getErrorMessage(error)}`)
    }
  }

  const loadBudget = async () => {
    if (!authToken) return
    setLoadingBudget(true)
    try {
      const response = await axios.get(`${API_BASE_URL}/api/skills/budget/data`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      setBudget(response.data.data || { income: 0, expenses: [], categories: {} })
    } catch (error) {
      console.error('Failed to load budget:', error)
      setBudget({ income: 0, expenses: [], categories: {} })
    } finally {
      setLoadingBudget(false)
    }
  }

  const setIncome = async () => {
    if (!authToken || !budgetIncome.trim()) return
    
    try {
      await axios.post(
        `${API_BASE_URL}/api/skills/execute`,
        {
          skill_id: 'budget',
          task: 'set income',
          parameters: { income: parseFloat(budgetIncome) }
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      setBudgetIncome('')
      await loadBudget()
    } catch (error: unknown) {
      alert(`Failed to set income: ${getErrorMessage(error)}`)
    }
  }

  const addBudgetExpense = async () => {
    if (!authToken || !newBudgetExpenseAmount.trim() || !newBudgetExpenseCategory.trim()) return
    
    try {
      await axios.post(
        `${API_BASE_URL}/api/skills/execute`,
        {
          skill_id: 'budget',
          task: 'add expense',
          parameters: {
            amount: parseFloat(newBudgetExpenseAmount),
            category: newBudgetExpenseCategory,
            description: newBudgetExpenseDescription
          }
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      setNewBudgetExpenseAmount('')
      setNewBudgetExpenseCategory('')
      setNewBudgetExpenseDescription('')
      await loadBudget()
    } catch (error: unknown) {
      alert(`Failed to add expense: ${getErrorMessage(error)}`)
    }
  }

  const loadMealPlans = async () => {
    if (!authToken) return
    setLoadingMealPlans(true)
    try {
      const response = await axios.get(`${API_BASE_URL}/api/skills/meal_planning/data`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      setMealPlans(response.data.data || [])
    } catch (error) {
      console.error('Failed to load meal plans:', error)
      setMealPlans([])
    } finally {
      setLoadingMealPlans(false)
    }
  }

  const addMealPlan = async () => {
    if (!authToken || !newMealPlanName.trim() || !newMealPlanDate.trim()) return
    
    try {
      await axios.post(
        `${API_BASE_URL}/api/skills/execute`,
        {
          skill_id: 'meal_planning',
          task: 'create meal plan',
          parameters: {
            name: newMealPlanName,
            date: newMealPlanDate,
            meals: newMealPlanMeals.split('\n').filter(m => m.trim())
          }
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      setNewMealPlanName('')
      setNewMealPlanDate('')
      setNewMealPlanMeals('')
      await loadMealPlans()
    } catch (error: unknown) {
      alert(`Failed to create meal plan: ${getErrorMessage(error)}`)
    }
  }

  const loadCRMData = async () => {
    if (!authToken) return
    setLoadingCRM(true)
    try {
      const [contactsRes, dealsRes, tasksRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/crm/contacts`, { headers: { Authorization: `Bearer ${authToken}` } }),
        axios.get(`${API_BASE_URL}/api/crm/deals`, { headers: { Authorization: `Bearer ${authToken}` } }),
        axios.get(`${API_BASE_URL}/api/crm/tasks`, { headers: { Authorization: `Bearer ${authToken}` } })
      ])
      setCrmContacts(contactsRes.data.contacts || [])
      setCrmDeals(dealsRes.data.deals || [])
      setCrmTasks(tasksRes.data.tasks || [])
    } catch (error) {
      console.error('Failed to load CRM data:', error)
      setCrmContacts([])
      setCrmDeals([])
      setCrmTasks([])
    } finally {
      setLoadingCRM(false)
    }
  }

  const handleLogin = async () => {
    // Validate - MUST come from login input fields
    if (!loginUsername.trim()) {
      alert('Please enter your username')
      return
    }
    
    if (!loginPassword.trim()) {
      alert('Please enter your password')
      return
    }
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        username: loginUsername.trim(),
        password: loginPassword
      })
      
      // Store authentication data in localStorage for persistence
      setAuthTokenUtil(response.data.token)
      localStorage.setItem('username', response.data.username) // Store username for next login
      
      setAuthToken(response.data.token)
      setCurrentUser(response.data)
      setIsAuthenticated(true)
      setShowLogin(false)
      
      // Update tab title with user's name if available
      if (response.data.profile?.name) {
        document.title = `${response.data.profile.name}'s Personal AI`
      } else if (response.data.username) {
        document.title = `${capitalizeUsername(response.data.username)}'s Personal AI`
      }
      
      // Clear password (keep username for convenience)
      setLoginPassword('')
      
      // Signin users should NEVER see onboarding - they already have accounts
      // Only signup should trigger onboarding
      await loadSkills()
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error) || 'Login failed'
      
      // Provide more helpful error messages
      if (errorMessage.includes('Invalid username or password')) {
        alert('Login failed: Invalid username or password. Please check your credentials and try again.')
      } else if (errorMessage.includes('username')) {
        alert(`Login failed: ${errorMessage}`)
      } else {
        alert(`Login failed: ${errorMessage}. Please try again.`)
      }
      
      // Clear password on error for security
      setLoginPassword('')
    }
  }

  const checkUsernameAvailability = async (username: string) => {
    if (!username.trim() || username.trim().length < 3) {
      setUsernameError('')
      return
    }
    
    setCheckingUsername(true)
    setUsernameError('')
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/check-username`, {
        params: { username: username.trim() }
      })
      
      if (!response.data.available) {
        setUsernameError(response.data.error || 'Username is not available')
      } else {
        setUsernameError('')
      }
    } catch (error: unknown) {
      // If check fails, we'll validate on signup
      setUsernameError('')
    } finally {
      setCheckingUsername(false)
    }
  }

  const handleSignup = async () => {
    // Clear previous errors
    setUsernameError('')
    setPasswordError('')
    
    // Validate username - MUST come from signup input fields
    if (!signupUsername.trim()) {
      setUsernameError('Username is required')
      return
    }
    
    if (signupUsername.trim().length < 3) {
      setUsernameError('Username must be at least 3 characters')
      return
    }
    
    // Validate password - MUST come from signup input fields
    if (!signupPassword.trim()) {
      setPasswordError('Password is required')
      return
    }
    
    if (signupPassword.trim().length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }
    
    // Additional validation: ensure username is available (no error)
    if (usernameError) {
      return // Don't proceed if username has an error
    }
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/signup`, {
        username: signupUsername.trim(),
        password: signupPassword
      })
      setAuthTokenUtil(response.data.token)
      setAuthToken(response.data.token)
      setCurrentUser(response.data)
      setIsAuthenticated(true)
      setShowLogin(false)
      
      // Clear form
      setSignupUsername('')
      setSignupPassword('')
      setUsernameError('')
      setPasswordError('')
      
      await loadOnboardingQuestions()
      setShowOnboarding(true)
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error)
      
      // Check if it's a username error
      if (errorMessage.toLowerCase().includes('username') || errorMessage.toLowerCase().includes('taken')) {
        setUsernameError(errorMessage)
      } else if (errorMessage.toLowerCase().includes('password')) {
        setPasswordError(errorMessage)
      } else {
        alert(`Signup failed: ${errorMessage}`)
      }
    }
  }

  const handleOnboardingAnswer = (questionId: string, answer: string) => {
    setOnboardingAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const handleOnboardingNext = () => {
    if (currentQuestionIndex < onboardingQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      completeOnboarding()
    }
  }

  const completeOnboarding = async () => {
    try {
      // Save profile
      await axios.post(
        `${API_BASE_URL}/api/auth/complete-onboarding`,
        onboardingAnswers,
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      
      // Select assistant if chosen
      if (selectedAssistantId) {
        await axios.post(
          `${API_BASE_URL}/api/auth/select-assistant`,
          { assistant_id: selectedAssistantId },
          { headers: { Authorization: `Bearer ${authToken}` } }
        )
      }
      
      setShowOnboarding(false)
      setCurrentQuestionIndex(0)
      setOnboardingAnswers({})
      await loadSkills()
      if (authToken) {
        // Refresh user data to get updated profile with name
        const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${authToken}` }
        })
        setCurrentUser(response.data)
        
        // Update tab title with user's name
        if (response.data.profile?.name) {
          document.title = `${response.data.profile.name}'s Personal AI`
        } else if (response.data.username) {
          document.title = `${capitalizeUsername(response.data.username)}'s Personal AI`
        }
      }
    } catch (error: unknown) {
      alert(`Failed to save profile: ${getErrorMessage(error)}`)
    }
  }

  // Sign out handler
  const handleSignOut = () => {
    removeAuthToken()
    localStorage.removeItem('username')
    setAuthToken(null)
    setIsAuthenticated(false)
    setCurrentUser(null)
    setShowLogin(true)
    setMessages([])
    setConversations([])
    setImageHistory([])
    setVideoHistory([])
    setSongHistory([])
    document.title = 'Personal AI - Local AI Service'
  }

  const findSkillForIssue = async (issue: string) => {
    if (!authToken || !issue.trim() || findingSkill) return
    
    setFindingSkill(true)
    setSkillSuggestion(null)
    
    try {
      // Use AI to find the best skill for the issue
      const response = await axios.post(
        `${API_BASE_URL}/api/chat`,
        {
          message: `I need help with: "${issue}". Based on the available skills: ${skills.map(s => `${s.name} (${s.description})`).join(', ')}, which skill should I use? Respond with just the skill name that best matches my need.`,
          conversation_id: null
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      
      const aiResponse = response.data.response.toLowerCase()
      
      // Find matching skill
      let matchedSkill: Skill | null = null
      for (const skill of skills) {
        if (aiResponse.includes(skill.name.toLowerCase()) || 
            aiResponse.includes(skill.id.toLowerCase()) ||
            skill.description.toLowerCase().includes(issue.toLowerCase()) ||
            issue.toLowerCase().includes(skill.name.toLowerCase())) {
          matchedSkill = skill
          break
        }
      }
      
      // If no direct match, try fuzzy matching with skill descriptions
      if (!matchedSkill) {
        const issueWords = issue.toLowerCase().split(/\s+/)
        for (const skill of skills) {
          const skillWords = (skill.name + ' ' + skill.description).toLowerCase()
          const matchCount = issueWords.filter(word => skillWords.includes(word)).length
          if (matchCount >= 2) {
            matchedSkill = skill
            break
          }
        }
      }
      
      if (matchedSkill) {
        setSkillSuggestion({
          skill: matchedSkill,
          message: `I found the perfect skill for you: ${matchedSkill.name}`
        })
        setSelectedSkill(matchedSkill)
        // Expand the skill card
        setExpandedSkills(prev => new Set(prev).add(matchedSkill!.id))
      } else {
        setSkillSuggestion({
          skill: null,
          message: `I couldn't find a specific skill for "${issue}", but you can browse the skills below or describe what you need in more detail.`
        })
      }
    } catch (error: unknown) {
      setSkillSuggestion({
        skill: null,
        message: `Error finding skill: ${getErrorMessage(error)}`
      })
    } finally {
      setFindingSkill(false)
    }
  }

  const speakAsAvatar = (message: string, duration: number = 3000) => {
    setAvatarMessage(message)
    setAvatarTalking(true)
    setTimeout(() => {
      setAvatarTalking(false)
      setTimeout(() => setAvatarMessage(''), 500)
    }, duration)
  }

  const openSkillPage = (skill: Skill) => {
    setCurrentSkillView(skill)
    setActiveView(`skill_${skill.id}`)
    setSkillTask('')
    speakAsAvatar(`Hey! I see you want to use ${skill.name}. What would you like me to help you with?`, 4000)
  }

  const handleExecuteSkill = async (skill?: Skill | null, task?: string) => {
    const skillToUse = skill || selectedSkill
    const taskToUse = task || skillTask
    
    if (!skillToUse || !taskToUse?.trim() || executingSkill || !authToken) return
    
    // Close all expanded menus when executing a skill
    closeAllExpandedMenus()
    
    setExecutingSkill(true)
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/skills/execute`,
        {
          skill_id: skillToUse.id,
          task: taskToUse.trim(),
          parameters: {}
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      
      const resultMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `**${skillToUse.name}**\n\n${response.data.result}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, resultMessage])
      setSkillTask('')
      setSelectedSkill(null)
      // Switch to chat view to show the result
      setActiveView('chat')
    } catch (error: unknown) {
      alert(`Error executing skill: ${error.response?.data?.detail || error.message}`)
    } finally {
      setExecutingSkill(false)
    }
  }

  const handleNewDocument = (skillId: string) => {
    // Close all expanded menus when selecting a skill
    closeAllExpandedMenus()
    setSelectedSkill(skills.find(s => s.id === skillId) || null)
    setSkillTask('')
  }

  const handleOpenFolder = async (skillId: string, event?: React.MouseEvent | React.TouchEvent) => {
    if (!authToken) return
    
    // Check for long press or right click
    const isLongPress = event?.type === 'touchstart' || (event as React.MouseEvent)?.button === 2
    const shouldShowRecent = isLongPress || (event as React.MouseEvent)?.ctrlKey || (event as React.MouseEvent)?.metaKey
    
    if (shouldShowRecent) {
      // Show recent documents
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/files/recent-documents?skill_id=${skillId}&limit=25`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        )
        setRecentDocuments(response.data.documents || [])
        setRecentDocumentsSkillId(skillId)
        if (event) {
          const mouseEvent = event as React.MouseEvent
          setContextMenuPosition({ x: mouseEvent.clientX, y: mouseEvent.clientY })
        }
        setShowRecentDocuments(true)
      } catch (error: unknown) {
        console.error('Error loading recent documents:', error)
      }
    } else {
      // Open folder
      try {
        await axios.post(
          `${API_BASE_URL}/api/files/open-folder`,
          { folder_type: 'logs' },
          { headers: { Authorization: `Bearer ${authToken}` } }
        )
      } catch (error: unknown) {
        alert(`Error opening folder: ${error.response?.data?.detail || error.message}`)
      }
    }
  }

  const handleLastDocument = async (skillId: string) => {
    if (!authToken) return
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/files/recent-documents?skill_id=${skillId}&limit=1`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      
      if (response.data.documents && response.data.documents.length > 0) {
        const lastDoc = response.data.documents[0]
        // Open the document folder
        try {
          await axios.post(
            `${API_BASE_URL}/api/files/open-folder`,
            { skill_id: skillId },
            { headers: { Authorization: `Bearer ${authToken}` } }
          )
          // Show document info
          const message: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `📄 **Opened Last Document**\n\nDocument ID: ${lastDoc.document_id}\nCreated: ${lastDoc.created_at ? new Date(lastDoc.created_at).toLocaleString() : 'Unknown'}\n\nThe folder containing this document has been opened.`,
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, message])
          setActiveView('chat')
        } catch (error: unknown) {
          alert(`Failed to open document folder: ${error.response?.data?.detail || error.message}`)
        }
      } else {
        alert('No recent documents found for this skill')
      }
    } catch (error: unknown) {
      console.error('Error loading last document:', error)
    }
  }

  const loadConversations = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/conversations`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      
      const sorted = response.data.conversations.sort((a: Conversation, b: Conversation) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
      
      setAllConversations(sorted)
      setDisplayedConversations(sorted.slice(0, conversationsDisplayLimit))
      setConversations(sorted)
      
      // Auto-load last conversation if no messages are currently loaded
      if (messages.length === 0 && sorted.length > 0 && !conversationId) {
        loadConversation(sorted[0].conversation_id)
      }
      
      // Auto-greet if no messages and there's a last conversation
      if (messages.length === 0 && sorted.length > 0 && currentUser?.assistant?.name) {
        generateGreeting(sorted[0])
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }

  // Handle infinite scroll for conversations
  const handleConversationsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight
    
    // Load more when within 100px of bottom
    if (scrollBottom < 100 && displayedConversations.length < allConversations.length) {
      const newLimit = Math.min(conversationsDisplayLimit + 20, allConversations.length)
      setConversationsDisplayLimit(newLimit)
      setDisplayedConversations(allConversations.slice(0, newLimit))
    }
  }

  const generateGreeting = async (lastConversation: Conversation) => {
    if (!authToken || !currentUser?.assistant) return
    
    try {
      // Get the last conversation details
      const convResponse = await axios.get(`${API_BASE_URL}/api/conversations/${lastConversation.conversation_id}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      
      const lastMessages = convResponse.data.messages || []
      if (lastMessages.length === 0) return
      
      // Generate a greeting based on last conversation
      const greetingResponse = await axios.post(`${API_BASE_URL}/api/chat/greeting`, {
        conversation_summary: lastConversation.summary,
        last_messages: lastMessages.slice(-3).map((m: Message) => m.content).join('\n'),
        assistant_name: currentUser.assistant.name
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      
      const greetingMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: greetingResponse.data.greeting,
        timestamp: new Date(),
      }
      setMessages([greetingMessage])
    } catch (error) {
      // If greeting fails, just show welcome
      console.error('Failed to generate greeting:', error)
    }
  }

  const loadConversation = async (convId: string) => {
    if (!authToken) return
    try {
      const response = await axios.get(`${API_BASE_URL}/api/conversations/${convId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      const conv = response.data
      
      // Convert conversation messages to Message format
      const loadedMessages: Message[] = conv.messages.map((msg: any, index: number) => ({
        id: `${convId}-${index}`,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp)
      }))
      
      setMessages(loadedMessages)
      setConversationId(convId)
      setShowHistory(false)
    } catch (error: unknown) {
      // Handle 401 - authentication expired
      if (error.response?.status === 401) {
        console.error('Authentication expired. Please log in again.')
        removeAuthToken()
        localStorage.removeItem('username')
        setAuthToken(null)
        setIsAuthenticated(false)
        setShowLogin(true)
        return
      }
      console.error('Failed to load conversation:', error)
    }
  }

  const startNewConversation = () => {
    setMessages([])
    setConversationId(null)
    setShowHistory(false)
  }

  const loadImageHistory = async () => {
    if (!authToken) return
    try {
      const response = await axios.get(`${API_BASE_URL}/api/images`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      setImageHistory(response.data.images || [])
    } catch (error) {
      // Silently fail - user might not have images yet
    }
  }

  const loadVideoHistory = async () => {
    if (!authToken) return
    try {
      const response = await axios.get(`${API_BASE_URL}/api/videos`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      setVideoHistory(response.data.videos || [])
    } catch (error) {
      // Silently fail - user might not have videos yet
    }
  }

  const deleteMessage = (messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
  }

  const deleteConversation = async (convId: string) => {
    if (!authToken) return
    try {
      await axios.delete(`${API_BASE_URL}/api/conversations/${convId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      setAllConversations((prev) => prev.filter((c) => c.conversation_id !== convId))
      setDisplayedConversations((prev) => prev.filter((c) => c.conversation_id !== convId))
      if (conversationId === convId) {
        startNewConversation()
      }
      // Removed loadConversations() - state is already updated above, no need to reload
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      alert('Failed to delete conversation')
    }
  }

  const deleteImage = async (fileId: string) => {
    if (!authToken) return
    try {
      await axios.delete(`${API_BASE_URL}/api/image/${fileId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      setImageHistory((prev) => prev.filter((img) => img.file_id !== fileId))
      setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId))
      if (selectedFile?.id === fileId) {
        setSelectedFile(null)
      }
      loadImageHistory()
    } catch (error) {
      console.error('Failed to delete image:', error)
      alert('Failed to delete image')
    }
  }

  const deleteVideo = async (fileId: string) => {
    if (!authToken) return
    try {
      await axios.delete(`${API_BASE_URL}/api/video/${fileId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      setVideoHistory((prev) => prev.filter((vid) => vid.file_id !== fileId))
      setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId))
      if (selectedFile?.id === fileId) {
        setSelectedFile(null)
      }
      loadVideoHistory()
    } catch (error) {
      console.error('Failed to delete video:', error)
      alert('Failed to delete video')
    }
  }

  // Function to close all expanded sections and mobile sidebar
  const closeAllExpandedMenus = () => {
    setExpandedSections({
      chat: false,
      images: false,
      videos: false,
      songs: false,
      skills: false,
      wallet: false,
      projects: false,
      settings: false,
      assistants: false
    })
    setShowHistory(false)
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      // Only one parent folder can be open at a time (accordion behavior)
      const newSections: { [key: string]: boolean } = {}
      
      // If clicking the same section, toggle it
      if (prev[section]) {
        newSections[section] = false
      } else {
        // Close all other sections and open the clicked one
        newSections[section] = true
      }
      
      // Preserve child section states (like chat sub-items)
      Object.keys(prev).forEach(key => {
        if (!['chat', 'skills', 'songs', 'images', 'videos', 'wallet', 'projects', 'assistants'].includes(key)) {
          newSections[key] = prev[key]
        }
      })
      
      return { ...prev, ...newSections }
    })
  }

  // Check if message is an image/video editing command
  const isEditCommand = (message: string, hasSelectedFile: boolean): boolean => {
    if (!hasSelectedFile) return false
    
    const editKeywords = [
      'edit', 'change', 'modify', 'swap', 'replace', 'brighten', 'darken',
      'blur', 'sharpen', 'grayscale', 'black and white', 'rotate', 'flip',
      'contrast', 'saturate', 'color', 'filter', 'enhance', 'adjust',
      'make it', 'turn it', 'convert', 'transform', 'apply', 'turn me', 'make me'
    ]
    
    const messageLower = message.toLowerCase()
    return editKeywords.some(keyword => messageLower.includes(keyword))
  }

  // Check if message is a generation command
  const isGenerationCommand = (message: string): { type: 'image' | 'video' | null, prompt: string } => {
    const messageLower = message.toLowerCase()
    const imageKeywords = ['generate image', 'create image', 'make image', 'generate picture', 'create picture', 'draw']
    const videoKeywords = ['generate video', 'create video', 'make video', 'generate clip', 'create clip']
    
    if (imageKeywords.some(keyword => messageLower.includes(keyword))) {
      return { type: 'image', prompt: message }
    }
    if (videoKeywords.some(keyword => messageLower.includes(keyword))) {
      return { type: 'video', prompt: message }
    }
    return { type: null, prompt: message }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    // Close all expanded menus when sending a message
    closeAllExpandedMenus()

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const messageText = input
    setInput('')
    setLoading(true)

    // Check if this is an edit command for a selected file
    if (selectedFile && isEditCommand(messageText, true)) {
      setLoading(false)
      setEditInstruction(messageText)
      setTimeout(() => {
        handleEditWithMessage(messageText)
      }, 100)
      return
    }

    // Check if this is a generation command
    const genCommand = isGenerationCommand(messageText)
    if (genCommand.type === 'image') {
      setLoading(false)
      setImagePrompt(genCommand.prompt)
      setTimeout(() => {
        handleGenerateImageFromChat(genCommand.prompt)
      }, 100)
      return
    }
    if (genCommand.type === 'video') {
      setLoading(false)
      setVideoPrompt(genCommand.prompt)
      setTimeout(() => {
        handleGenerateVideoFromChat(genCommand.prompt)
      }, 100)
      return
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/chat`, {
        message: messageText,
        conversation_id: conversationId,
      })

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
        generatedImageIds: response.data.generated_image_ids || undefined,
      }

      const newConvId = response.data.conversation_id
      setConversationId(newConvId)
      setMessages((prev) => [...prev, assistantMessage])
      
      // Reload conversations list
      loadConversations()
      
      // Reload image/video history if files were generated
      loadImageHistory()
      loadVideoHistory()
    } catch (error: unknown) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error.response?.data?.detail || error.message}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleEditWithMessage = async (instruction: string) => {
    if (!selectedFile || !instruction.trim() || editing) return

    setEditing(true)
    try {
      const endpoint =
        selectedFile.type === 'image'
          ? `${API_BASE_URL}/api/image/edit`
          : `${API_BASE_URL}/api/video/edit`

      const response = await axios.post(endpoint, {
        file_id: selectedFile.id,
        instruction: instruction,
      })

      if (response.data.interpretation) {
        const interpretationMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `💭 I understand: ${response.data.interpretation}`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, interpretationMessage])
      }

      const editedFile: UploadedFile = {
        id: response.data.file_id,
        type: selectedFile.type,
        filename: `edited_${selectedFile.filename}`,
        url:
          selectedFile.type === 'image'
            ? `${API_BASE_URL}/api/image/${response.data.file_id}`
            : `${API_BASE_URL}/api/video/${response.data.file_id}`,
      }

      setUploadedFiles((prev) => [...prev, editedFile])
      setSelectedFile(editedFile)
      setEditInstruction('')

      const successMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `✅ Successfully edited ${selectedFile.type}! The changes have been applied.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, successMessage])
    } catch (error: unknown) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ Error editing: ${error.response?.data?.detail || error.message}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setEditing(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post(`${API_BASE_URL}/api/upload/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const uploadedFile: UploadedFile = {
        id: response.data.file_id,
        type: 'image',
        filename: response.data.filename,
        url: `${API_BASE_URL}/api/image/${response.data.file_id}`,
      }

      setUploadedFiles((prev) => [...prev, uploadedFile])
      setSelectedFile(uploadedFile)
      loadImageHistory()

      try {
        const analysisResponse = await axios.get(
          `${API_BASE_URL}/api/image/analyze`,
          { params: { file_id: response.data.file_id } }
        )
        const analysisMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Image uploaded: ${response.data.filename}\n\nAnalysis: ${analysisResponse.data.analysis}`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, analysisMessage])
      } catch (err) {
        // Analysis failed, but file is uploaded
      }
    } catch (error: unknown) {
      alert(`Error uploading image: ${error.response?.data?.detail || error.message}`)
    }
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post(`${API_BASE_URL}/api/upload/video`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const uploadedFile: UploadedFile = {
        id: response.data.file_id,
        type: 'video',
        filename: response.data.filename,
        url: `${API_BASE_URL}/api/video/${response.data.file_id}`,
      }

      setUploadedFiles((prev) => [...prev, uploadedFile])
      setSelectedFile(uploadedFile)
      loadVideoHistory()

      const infoMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Video uploaded: ${response.data.filename}\nDimensions: ${response.data.dimensions.width}x${response.data.dimensions.height}\nDuration: ${response.data.duration.toFixed(2)}s\nFPS: ${response.data.fps.toFixed(2)}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, infoMessage])
    } catch (error: unknown) {
      alert(`Error uploading video: ${error.response?.data?.detail || error.message}`)
    }
  }

  const handleEdit = async () => {
    if (!selectedFile || !editInstruction.trim() || editing) return

    setEditing(true)
    try {
      const endpoint =
        selectedFile.type === 'image'
          ? `${API_BASE_URL}/api/image/edit`
          : `${API_BASE_URL}/api/video/edit`

      const response = await axios.post(endpoint, {
        file_id: selectedFile.id,
        instruction: editInstruction,
      })

      const editedFile: UploadedFile = {
        id: response.data.file_id,
        type: selectedFile.type,
        filename: `edited_${selectedFile.filename}`,
        url:
          selectedFile.type === 'image'
            ? `${API_BASE_URL}/api/image/${response.data.file_id}`
            : `${API_BASE_URL}/api/video/${response.data.file_id}`,
      }

      setUploadedFiles((prev) => [...prev, editedFile])
      setSelectedFile(editedFile)
      setEditInstruction('')

      if (response.data.interpretation) {
        const interpretationMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `💭 I understand: ${response.data.interpretation}`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, interpretationMessage])
      }

      const successMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `✅ Successfully edited ${selectedFile.type}! The changes have been applied.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, successMessage])
    } catch (error: unknown) {
      alert(`Error editing: ${error.response?.data?.detail || error.message}`)
    } finally {
      setEditing(false)
    }
  }

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || generatingImage) return

    setGeneratingImage(true)
    const logId = addProgressLog({
      type: 'image',
      title: 'Generating Image',
      status: 'in_progress',
      progress: 0,
      message: `Generating image: "${imagePrompt}"`
    })

    try {
      updateProgressLog(logId, { progress: 20, message: 'Sending request to server...' })
      const response = await axios.post(`${API_BASE_URL}/api/image/generate`, {
        prompt: imagePrompt,
      })

      updateProgressLog(logId, { progress: 60, message: 'Processing image generation...' })

      const generatedFile: UploadedFile = {
        id: response.data.file_id,
        type: 'image',
        filename: `generated_${response.data.file_id}.png`,
        url: `${API_BASE_URL}/api/image/${response.data.file_id}`,
      }

      updateProgressLog(logId, { progress: 90, message: 'Finalizing image...' })

      setUploadedFiles((prev) => [...prev, generatedFile])
      setSelectedFile(generatedFile)
      const prompt = imagePrompt
      setImagePrompt('')
      loadImageHistory()

      updateProgressLog(logId, {
        status: 'completed',
        progress: 100,
        message: `Image generated successfully!`,
        details: `File ID: ${response.data.file_id}`
      })

      const successMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ Image generated! Prompt: "${prompt}"`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, successMessage])
    } catch (error: unknown) {
      updateProgressLog(logId, {
        status: 'error',
        progress: 0,
        message: `Error generating image: ${error.response?.data?.detail || error.message}`
      })
      alert(`Error generating image: ${error.response?.data?.detail || error.message}`)
    } finally {
      setGeneratingImage(false)
    }
  }

  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim() || generatingVideo) return

    setGeneratingVideo(true)
    const logId = addProgressLog({
      type: 'video',
      title: 'Generating Video',
      status: 'in_progress',
      progress: 0,
      message: `Generating video: "${videoPrompt}"`
    })

    try {
      updateProgressLog(logId, { progress: 10, message: 'Sending request to server...' })
      const response = await axios.post(`${API_BASE_URL}/api/video/generate`, {
        prompt: videoPrompt,
      })

      updateProgressLog(logId, { progress: 30, message: 'Processing video generation...' })

      const generatedFile: UploadedFile = {
        id: response.data.file_id,
        type: 'video',
        filename: `generated_${response.data.file_id}.mp4`,
        url: `${API_BASE_URL}/api/video/${response.data.file_id}`,
      }

      updateProgressLog(logId, { progress: 80, message: 'Finalizing video...' })

      setUploadedFiles((prev) => [...prev, generatedFile])
      setSelectedFile(generatedFile)
      const prompt = videoPrompt
      setVideoPrompt('')
      loadVideoHistory()

      updateProgressLog(logId, {
        status: 'completed',
        progress: 100,
        message: `Video generated successfully!`,
        details: `File ID: ${response.data.file_id}`
      })

      const successMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ Video generated! Prompt: "${prompt}"`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, successMessage])
    } catch (error: unknown) {
      updateProgressLog(logId, {
        status: 'error',
        progress: 0,
        message: `Error generating video: ${error.response?.data?.detail || error.message}`
      })
      alert(`Error generating video: ${error.response?.data?.detail || error.message}`)
    } finally {
      setGeneratingVideo(false)
    }
  }

  const handleGenerateSong = async (promptOverride?: string, forFansOfOverride?: string) => {
    const prompt = promptOverride || songPrompt
    const forFansOf = forFansOfOverride !== undefined ? forFansOfOverride : songForFansOf
    
    if (!prompt.trim() || generatingSong) return

    setGeneratingSong(true)
    const logId = addProgressLog({
      type: 'song',
      title: 'Generating Song',
      status: 'in_progress',
      progress: 0,
      message: `Generating song: "${prompt}"${forFansOf ? ` (for fans of: ${forFansOf})` : ''}`
    })

    try {
      updateProgressLog(logId, { progress: 10, message: 'Generating lyrics...' })
      const response = await axios.post(`${API_BASE_URL}/api/song/generate`, {
        prompt: prompt,
        for_fans_of: forFansOf.trim() || undefined,
        genre: undefined,
        mood: undefined,
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      })

      updateProgressLog(logId, { progress: 60, message: 'Lyrics generated. Processing audio...' })

      const audioUrl = response.data.audio_file 
        ? `${API_BASE_URL}${response.data.audio_file}`
        : undefined

      updateProgressLog(logId, { 
        progress: audioUrl ? 90 : 100, 
        message: audioUrl ? 'Finalizing audio...' : 'Song generated (audio not available)' 
      })

      const songMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `🎵 Song Generated!\n\nTitle: ${prompt}\n${forFansOf ? `For Fans Of: ${forFansOf}\n` : ''}\n---\n\n${response.data.lyrics}${audioUrl ? '\n\n🎧 Audio available below!' : '\n\n⚠️ Audio generation not available. Install audiocraft and torch for full music generation.'}`,
        timestamp: new Date(),
        audioUrl: audioUrl,
      }

      setMessages((prev) => [...prev, songMessage])
      setSongPrompt('')
      setSongForFansOf('')
      loadSongHistory()

      updateProgressLog(logId, {
        status: 'completed',
        progress: 100,
        message: `Song generated successfully!`,
        details: `Song ID: ${response.data.song_id}${audioUrl ? ' (with audio)' : ' (lyrics only)'}`
      })
    } catch (error: unknown) {
      updateProgressLog(logId, {
        status: 'error',
        progress: 0,
        message: `Error generating song: ${error.response?.data?.detail || error.message}`
      })
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error generating song: ${error.response?.data?.detail || error.message}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setGeneratingSong(false)
    }
  }

  const loadSongHistory = async () => {
    if (!authToken) return
    try {
      const response = await axios.get(`${API_BASE_URL}/api/songs`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      setSongHistory(response.data.songs || [])
      
      // Load song details for songs with audio
      for (const song of response.data.songs || []) {
        if (song.audio_file || song.song_id) {
          loadSongDetails(song.song_id)
        }
      }
    } catch (error) {
      // Silently fail - user might not have songs yet
    }
  }

  const loadSongDetails = async (songId: string): Promise<void> => {
    if (!authToken || songDetails[songId]) return // Already loaded
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/songs/${songId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      setSongDetails(prev => ({
        ...prev,
        [songId]: response.data
      }))
    } catch (error) {
      console.error('Failed to load song details:', error)
      throw error
    }
  }

  const togglePlayPause = async (songId: string) => {
    const audio = audioRefs.current[songId]
    
    if (!audio) {
      // Load song details if not loaded
      let songDetail = songDetails[songId]
      if (!songDetail) {
        try {
          // Load details directly
          const response = await axios.get(`${API_BASE_URL}/api/songs/${songId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
          })
          songDetail = response.data
          // Update state for future use
          setSongDetails(prev => ({
            ...prev,
            [songId]: songDetail
          }))
        } catch (error) {
          console.error('Failed to load song details:', error)
          alert('Failed to load song. Please try again.')
          return
        }
      }
      
      if (!songDetail) {
        alert('Song details not available. Please try again.')
        return
      }
      
      const audioUrl = songDetail?.audio_file 
        ? `${API_BASE_URL}${songDetail.audio_file}`
        : `${API_BASE_URL}/api/songs/${songId}/audio`
      
      const newAudio = new Audio(audioUrl)
      audioRefs.current[songId] = newAudio
      
      newAudio.addEventListener('ended', () => {
        setCurrentlyPlaying(null)
      })
      
      newAudio.addEventListener('error', () => {
        setCurrentlyPlaying(null)
        alert('Failed to load audio. This song may not have audio available.')
      })
      
      try {
        await newAudio.play()
        setCurrentlyPlaying(songId)
      } catch (error) {
        console.error('Failed to play audio:', error)
        alert('Failed to play audio. Please try again.')
      }
    } else {
      if (currentlyPlaying === songId) {
        // Pause
        audio.pause()
        setCurrentlyPlaying(null)
      } else {
        // Stop other songs and play this one
        Object.values(audioRefs.current).forEach(a => {
          if (a) {
            a.pause()
            a.currentTime = 0
          }
        })
        try {
          await audio.play()
          setCurrentlyPlaying(songId)
        } catch (error) {
          console.error('Failed to play audio:', error)
          alert('Failed to play audio. Please try again.')
        }
      }
    }
  }

  const deleteSong = async (songId: string) => {
    if (!authToken) return
    try {
      await axios.delete(`${API_BASE_URL}/api/songs/${songId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      setSongHistory((prev) => prev.filter((s) => s.song_id !== songId))
      loadSongHistory()
    } catch (error: unknown) {
      // Handle 401 - authentication expired
      if (error.response?.status === 401) {
        console.error('Authentication expired. Please log in again.')
        removeAuthToken()
        localStorage.removeItem('username')
        setAuthToken(null)
        setIsAuthenticated(false)
        setShowLogin(true)
        return
      }
      console.error('Failed to delete song:', error)
      alert('Failed to delete song')
    }
  }

  const regenerateSongAudio = async (songId: string) => {
    if (!authToken) return
    
    const logId = addProgressLog({
      type: 'song',
      title: 'Regenerating Audio',
      status: 'in_progress',
      progress: 0,
      message: 'Generating audio for song...'
    })
    
    try {
      updateProgressLog(logId, { progress: 20, message: 'Starting audio generation...' })
      const response = await axios.post(
        `${API_BASE_URL}/api/songs/${songId}/regenerate-audio`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      
      updateProgressLog(logId, { progress: 80, message: 'Audio generated! Loading...' })
      
      // Reload song details to get the new audio file
      await loadSongDetails(songId)
      loadSongHistory()
      
      updateProgressLog(logId, {
        status: 'completed',
        progress: 100,
        message: 'Audio regenerated successfully!'
      })
      
      const successMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ Audio regenerated successfully for "${songHistory.find(s => s.song_id === songId)?.prompt || 'song'}"!\n\n🎧 You can now play the audio.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, successMessage])
    } catch (error: unknown) {
      updateProgressLog(logId, {
        status: 'error',
        progress: 0,
        message: `Failed to regenerate audio: ${error.response?.data?.detail || error.message}`
      })
      alert(`Failed to regenerate audio: ${error.response?.data?.detail || error.message}`)
    }
  }

  const handleSongUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/flac', 'audio/ogg', 'audio/aac']
    const allowedExtensions = ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.aac']
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExt)) {
      alert('Unsupported file type. Please upload MP3, WAV, M4A, FLAC, OGG, or AAC files.')
      return
    }

    setUploadingSong(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post(`${API_BASE_URL}/api/song/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${authToken || getAuthToken()}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      const successMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `🎵 Song uploaded successfully!\n\nFile: ${file.name}\n\nUse the analyze feature to have AI review it, or create rewrites, covers, and alternative versions.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, successMessage])
      loadSongHistory()
    } catch (error: unknown) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error uploading song: ${error.response?.data?.detail || error.message}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setUploadingSong(false)
      if (songFileInputRef.current) {
        songFileInputRef.current.value = ''
      }
    }
  }

  const handleAnalyzeSong = async (songId: string) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/song/analyze`,
        { song_id: songId },
        {
          headers: {
            'Authorization': `Bearer ${authToken || getAuthToken()}`
          }
        }
      )

      const message: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `🎵 Song Analysis Complete!\n\n${response.data.analysis_text || JSON.stringify(response.data.analysis, null, 2)}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, message])
      loadSongHistory()
    } catch (error: unknown) {
      alert(`Failed to analyze song: ${error.response?.data?.detail || error.message}`)
    }
  }

  const handleRewriteSong = async (songId: string, instruction?: string) => {
    const rewriteInstruction = instruction || window.prompt('Enter rewrite instruction (e.g., "make it more upbeat", "change to rock style"):')
    if (!rewriteInstruction) return

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/song/rewrite`,
        { song_id: songId, instruction: rewriteInstruction },
        {
          headers: {
            'Authorization': `Bearer ${authToken || getAuthToken()}`
          }
        }
      )

      const message: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `🎵 Song Rewritten!\n\n---\n\n${response.data.lyrics}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, message])
      loadSongHistory()
    } catch (error: unknown) {
      alert(`Failed to rewrite song: ${error.response?.data?.detail || error.message}`)
    }
  }

  const handleCreateCover = async (songId: string, style?: string) => {
    const coverStyle = style || prompt('Enter cover style (e.g., "acoustic", "electronic", "jazz"):')
    if (!coverStyle) return

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/song/cover`,
        { song_id: songId, style: coverStyle },
        {
          headers: {
            'Authorization': `Bearer ${authToken || getAuthToken()}`
          }
        }
      )

      const message: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `🎵 Cover Created (${coverStyle} style)!\n\n---\n\n${response.data.lyrics}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, message])
      loadSongHistory()
    } catch (error: unknown) {
      alert(`Failed to create cover: ${error.response?.data?.detail || error.message}`)
    }
  }

  const handleCreateAlternative = async (songId: string, variation?: string) => {
    const altVariation = variation || window.prompt('Enter variation type (e.g., "remix", "slower version", "instrumental"):')
    if (!altVariation) return

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/song/alternative`,
        { song_id: songId, variation: altVariation },
        {
          headers: {
            'Authorization': `Bearer ${authToken || getAuthToken()}`
          }
        }
      )

      const message: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `🎵 Alternative Version Created (${altVariation})!\n\n---\n\n${response.data.content}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, message])
      loadSongHistory()
    } catch (error: unknown) {
      alert(`Failed to create alternative version: ${error.response?.data?.detail || error.message}`)
    }
  }

  // CRM handlers - using loadCRMData defined above

  // BSV Inscription handler
  const handleInscribeToBsv = async (type: 'text' | 'file' | 'url' | 'document', data?: string | File) => {
    setInscribingToBsv(true)
    try {
      const requestData: any = { type }
      if (type === 'text') {
        requestData.content = data || window.prompt('Enter text to inscribe to BSV:')
        requestData.title = window.prompt('Enter title (optional):') || 'Untitled Inscription'
      } else if (type === 'file') {
        requestData.file_id = data
        requestData.title = window.prompt('Enter title (optional):') || 'File Inscription'
      } else if (type === 'url') {
        requestData.url = data || window.prompt('Enter URL to inscribe:')
        requestData.title = window.prompt('Enter title (optional):') || 'URL Inscription'
      } else if (type === 'document') {
        requestData.content = data || window.prompt('Enter document content:')
        requestData.title = window.prompt('Enter title (optional):') || 'Document Inscription'
      }

      if (!requestData.content && !requestData.file_id && !requestData.url) return

      const response = await axios.post(
        `${API_BASE_URL}/api/bsv/inscribe`,
        requestData,
        { headers: { Authorization: `Bearer ${authToken || getAuthToken()}` } }
      )

      const message: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ Data prepared for BSV inscription!\n\nInscription ID: ${response.data.inscription_id}\nBSV Address: ${response.data.bsv_address}\n\n${response.data.message}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, message])
      
      // Reload inscriptions
      const inscriptionsRes = await axios.get(`${API_BASE_URL}/api/bsv/inscriptions`, {
        headers: { Authorization: `Bearer ${authToken || getAuthToken()}` }
      })
      setBsvInscriptions(inscriptionsRes.data.inscriptions || [])
    } catch (error: unknown) {
      alert(`Failed to inscribe: ${error.response?.data?.detail || error.message}`)
    } finally {
      setInscribingToBsv(false)
    }
  }

  // Gallery Cleaner handlers
  const scanGallery = async () => {
    setScanningGallery(true)
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/gallery/scan`,
        {},
        { headers: { Authorization: `Bearer ${authToken || getAuthToken()}` } }
      )
      setGalleryScanResults(response.data)
    } catch (error: unknown) {
      alert(`Failed to scan gallery: ${error.response?.data?.detail || error.message}`)
    } finally {
      setScanningGallery(false)
    }
  }

  const deleteSelectedImages = async () => {
    if (selectedImagesToDelete.length === 0) return
    
    try {
      await axios.post(
        `${API_BASE_URL}/api/gallery/delete`,
        { file_ids: selectedImagesToDelete },
        { headers: { Authorization: `Bearer ${authToken || getAuthToken()}` } }
      )
      setSelectedImagesToDelete([])
      scanGallery() // Rescan after deletion
      alert(`Deleted ${selectedImagesToDelete.length} image(s)`)
    } catch (error: unknown) {
      alert(`Failed to delete images: ${error.response?.data?.detail || error.message}`)
    }
  }

  const handleGenerateImageFromChat = async (prompt: string) => {
    if (!prompt.trim() || generatingImage) return

    setGeneratingImage(true)
    const logId = addProgressLog({
      type: 'image',
      title: 'Generating Image',
      status: 'in_progress',
      progress: 0,
      message: `Generating image: "${prompt}"`
    })

    try {
      updateProgressLog(logId, { progress: 20, message: 'Sending request to server...' })
      const response = await axios.post(`${API_BASE_URL}/api/image/generate`, {
        prompt: prompt,
      })

      updateProgressLog(logId, { progress: 60, message: 'Processing image generation...' })

      const generatedFile: UploadedFile = {
        id: response.data.file_id,
        type: 'image',
        filename: `generated_${response.data.file_id}.png`,
        url: `${API_BASE_URL}/api/image/${response.data.file_id}`,
      }

      updateProgressLog(logId, { progress: 90, message: 'Finalizing image...' })

      setUploadedFiles((prev) => [...prev, generatedFile])
      setSelectedFile(generatedFile)
      loadImageHistory()

      updateProgressLog(logId, {
        status: 'completed',
        progress: 100,
        message: `Image generated successfully!`,
        details: `File ID: ${response.data.file_id}`
      })

      const successMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ Image generated! Prompt: "${prompt}"`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, successMessage])
    } catch (error: unknown) {
      updateProgressLog(logId, {
        status: 'error',
        progress: 0,
        message: `Error generating image: ${error.response?.data?.detail || error.message}`
      })
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ Error generating image: ${error.response?.data?.detail || error.message}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setGeneratingImage(false)
    }
  }

  const handleGenerateVideoFromChat = async (prompt: string) => {
    if (!prompt.trim() || generatingVideo) return

    setGeneratingVideo(true)
    try {
      const response = await axios.post(`${API_BASE_URL}/api/video/generate`, {
        prompt: prompt,
      })

      const generatedFile: UploadedFile = {
        id: response.data.file_id,
        type: 'video',
        filename: `generated_${response.data.file_id}.mp4`,
        url: `${API_BASE_URL}/api/video/${response.data.file_id}`,
      }

      setUploadedFiles((prev) => [...prev, generatedFile])
      setSelectedFile(generatedFile)
      loadVideoHistory()

      const successMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ Video generated! Prompt: "${prompt}"`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, successMessage])
    } catch (error: unknown) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ Error generating video: ${error.response?.data?.detail || error.message}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setGeneratingVideo(false)
    }
  }

  // Mobile UI Component
  const MobileUI = ({ isTablet = false }: { isTablet?: boolean }) => (
    <div className="flex flex-col h-screen bg-[#f5f5f7] overflow-hidden">
      {/* Mobile Header */}
      <div className={`bg-white border-b border-[#e8e8ed] ${isTablet ? 'px-6 py-4' : 'px-4 py-3'} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          {currentUser?.assistant?.id ? (
            <img
              src={`${API_BASE_URL}/api/avatars/${currentUser.assistant.id}`}
              alt={currentUser.assistant.name || 'AI Assistant'}
              className="w-8 h-8 rounded-xl object-cover border border-[#e8e8ed]"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                const fallback = e.currentTarget.nextElementSibling as HTMLElement
                if (fallback) fallback.style.display = 'flex'
              }}
            />
          ) : null}
          {!currentUser?.assistant?.id && (
            <Sparkles className="w-5 h-5 text-[#007AFF]" />
          )}
          <h1 className="text-xl font-semibold text-[#1d1d1f] leading-tight">Personal AI</h1>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="p-2 rounded-lg hover:bg-[#f5f5f7] transition-all"
        >
          <Menu className="w-5 h-5 text-[#1d1d1f]" />
        </button>
      </div>

      {/* Mobile History Sidebar (Slide-in) */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowHistory(false)}>
          <div className={`absolute left-0 top-0 bottom-0 ${isTablet ? 'w-96' : 'w-80'} bg-white shadow-xl`} onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-[#e8e8ed] flex items-center justify-between">
              <h2 className="font-semibold text-[#1d1d1f]">Menu</h2>
              <button onClick={() => setShowHistory(false)} className="p-2">
                <X className="w-5 h-5 text-[#86868b]" />
              </button>
            </div>
            <div className="overflow-y-auto h-full p-4 space-y-2">
              {/* Chat History */}
              <div className="bg-white border border-[#e8e8ed] rounded-xl overflow-hidden mb-2">
                <button
                  onClick={() => toggleSection('chat')}
                  className="w-full flex items-center justify-between px-4 py-3"
                >
                  <span className="font-medium text-sm text-[#1d1d1f]">Chat</span>
                  {expandedSections.chat ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedSections.chat && conversations.length > 0 && (
                  <div className="border-t border-[#e8e8ed]">
                    {conversations.map((conv) => (
                      <div key={conv.conversation_id} className="px-4 py-3 border-b border-[#e8e8ed] last:border-b-0">
                        <button
                          onClick={() => {
                            loadConversation(conv.conversation_id)
                            setShowHistory(false)
                          }}
                          className="w-full text-left"
                        >
                          <p className="text-sm font-medium text-[#1d1d1f] truncate">{conv.summary || 'Untitled'}</p>
                          <p className="text-xs text-[#86868b] mt-1">{conv.message_count} messages</p>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Image History */}
              <div className="bg-white border border-[#e8e8ed] rounded-xl overflow-hidden mb-2">
                <button
                  onClick={() => toggleSection('images')}
                  className="w-full flex items-center justify-between px-4 py-3"
                >
                  <span className="font-medium text-sm text-[#1d1d1f]">Images</span>
                  {expandedSections.images ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedSections.images && imageHistory.length > 0 && (
                  <div className="border-t border-[#e8e8ed] p-2">
                    {imageHistory.slice(0, 5).map((img) => (
                      <button
                        key={img.file_id}
                        onClick={() => {
                          setSelectedFile({ id: img.file_id, type: 'image', filename: img.filename, url: `${API_BASE_URL}${img.url}` })
                          setShowHistory(false)
                        }}
                        className="w-full text-left px-2 py-2 text-sm text-[#1d1d1f] truncate"
                      >
                        {img.filename}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Chat Area */}
      <div className={`flex-1 overflow-y-auto ${isTablet ? 'px-6 py-6' : 'px-4 py-4'}`}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              {currentUser?.assistant?.id ? (
                <img
                  src={`${API_BASE_URL}/api/avatars/${currentUser.assistant.id}`}
                  alt={currentUser.assistant.name || 'AI Assistant'}
                  className="w-16 h-16 rounded-2xl object-cover mx-auto mb-4 border border-[#e8e8ed]"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement
                    if (fallback) fallback.style.display = 'block'
                  }}
                />
              ) : null}
              <div className={`w-12 h-12 text-[#007AFF] mx-auto mb-4 ${currentUser?.assistant?.id ? 'hidden' : ''}`}>
                <Sparkles className="w-12 h-12 text-[#007AFF]" />
              </div>
              <h2 className="text-xl font-semibold text-[#1d1d1f] mb-2">Welcome to Personal AI</h2>
              <p className="text-[#86868b]">Start a conversation</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`${isTablet ? 'max-w-[75%]' : 'max-w-[85%]'} rounded-2xl ${isTablet ? 'px-5 py-4' : 'px-4 py-3'} ${
                    message.role === 'user'
                      ? 'bg-[#007AFF] text-white'
                      : 'bg-white border border-[#e8e8ed] text-[#1d1d1f]'
                  }`}
                >
                  <p className={`${isTablet ? 'text-base' : 'text-sm'} whitespace-pre-wrap`}>{message.content}</p>
                  {message.audioUrl && (
                    <div className="mt-3 pt-3 border-t border-[#e8e8ed]">
                      <audio 
                        controls 
                        className="w-full"
                        src={message.audioUrl}
                        style={{ maxWidth: '100%' }}
                      >
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-[#e8e8ed] rounded-2xl px-4 py-3">
                  <Loader2 className="w-5 h-5 text-[#007AFF] animate-spin" />
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Mobile Input */}
      <div className={`bg-white border-t border-[#e8e8ed] ${isTablet ? 'px-6 py-4' : 'px-4 py-3'} safe-area-bottom`}>
        <div className={`flex items-center ${isTablet ? 'gap-3' : 'gap-2'}`}>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-lg bg-[#f5f5f7] active:scale-95 transition-all"
          >
            <ImageIcon className="w-5 h-5 text-[#007AFF]" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              // Close expanded menus when user starts typing
              if (e.target.value.length > 0) {
                closeAllExpandedMenus()
              }
            }}
            placeholder="Type a message..."
            className="flex-1 bg-[#f5f5f7] rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="p-3 rounded-xl bg-[#007AFF] text-white active:scale-95 transition-all disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        {selectedFile && (
          <div className="mt-3 p-3 bg-[#f5f5f7] rounded-xl flex items-center gap-3">
            {selectedFile.type === 'image' ? (
              <img src={selectedFile.url} alt={selectedFile.filename} className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              <Video className="w-12 h-12 text-[#86868b]" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1d1d1f] truncate">{selectedFile.filename}</p>
              <input
                type="text"
                value={editInstruction}
                onChange={(e) => setEditInstruction(e.target.value)}
                placeholder="Edit instruction..."
                className="mt-2 w-full bg-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                onKeyPress={(e) => e.key === 'Enter' && handleEdit()}
              />
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="p-1"
            >
              <X className="w-4 h-4 text-[#86868b]" />
            </button>
          </div>
        )}
      </div>
    </div>
  )

  // Login Screen
  if (showLogin && !isAuthenticated) {
    return (
      <div className="flex h-screen bg-[#f5f5f7] items-center justify-center">
        <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md border border-[#e8e8ed]">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#1d1d1f] mb-2">Personal AI</h1>
            <p className="text-[#86868b]">{showSignupForm ? 'Create an account' : 'Sign in to your account'}</p>
          </div>
          
          {!showSignupForm ? (
            // Sign In Form (Default)
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  autoFocus
                />
              </div>
              <div>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <button
                onClick={handleLogin}
                disabled={!loginUsername.trim() || !loginPassword.trim()}
                className="w-full px-4 py-3 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sign In
              </button>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#e8e8ed]"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-[#86868b]">Don't have an account?</span>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setShowSignupForm(true)
                  setLoginUsername('')
                  setLoginPassword('')
                }}
                className="w-full px-4 py-3 rounded-xl bg-white border-2 border-[#007AFF] text-[#007AFF] font-semibold hover:bg-[#007AFF]/10 transition-all"
              >
                Create Account
              </button>
            </div>
          ) : (
            // Sign Up Form
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={signupUsername}
                  onChange={(e) => {
                    setSignupUsername(e.target.value)
                    // Debounce username check
                    const timeoutId = setTimeout(() => {
                      checkUsernameAvailability(e.target.value)
                    }, 500)
                    return () => clearTimeout(timeoutId)
                  }}
                  placeholder="New username (min 3 characters)"
                  className={`w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border ${
                    usernameError ? 'border-red-500' : 'border-[#e8e8ed]'
                  } focus:outline-none focus:ring-2 focus:ring-[#007AFF]`}
                  onKeyPress={(e) => e.key === 'Enter' && handleSignup()}
                  autoFocus
                />
                {checkingUsername && (
                  <p className="text-xs text-[#86868b] mt-1">Checking availability...</p>
                )}
                {usernameError && (
                  <p className="text-xs text-red-500 mt-1">{usernameError}</p>
                )}
                {!usernameError && signupUsername.trim().length >= 3 && !checkingUsername && (
                  <p className="text-xs text-green-600 mt-1">✓ Username available</p>
                )}
              </div>
              <div>
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => {
                    setSignupPassword(e.target.value)
                    setPasswordError('')
                  }}
                  placeholder="New password (min 6 characters)"
                  className={`w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border ${
                    passwordError ? 'border-red-500' : 'border-[#e8e8ed]'
                  } focus:outline-none focus:ring-2 focus:ring-[#007AFF]`}
                  onKeyPress={(e) => e.key === 'Enter' && handleSignup()}
                />
                {passwordError && (
                  <p className="text-xs text-red-500 mt-1">{passwordError}</p>
                )}
                {!passwordError && signupPassword.trim().length >= 6 && (
                  <p className="text-xs text-green-600 mt-1">✓ Password valid</p>
                )}
              </div>
              <button
                onClick={handleSignup}
                disabled={!signupUsername.trim() || !signupPassword.trim() || signupUsername.trim().length < 3 || signupPassword.trim().length < 6 || !!usernameError}
                className="w-full px-4 py-3 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Account
              </button>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#e8e8ed]"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-[#86868b]">Already have an account?</span>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setShowSignupForm(false)
                  setSignupUsername('')
                  setSignupPassword('')
                  setUsernameError('')
                  setPasswordError('')
                }}
                className="w-full px-4 py-3 rounded-xl bg-white border-2 border-[#007AFF] text-[#007AFF] font-semibold hover:bg-[#007AFF]/10 transition-all"
              >
                Sign In Instead
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Onboarding Screen
  if (showOnboarding && onboardingQuestions.length > 0) {
    const currentQuestion = onboardingQuestions[currentQuestionIndex]
    const progress = ((currentQuestionIndex + 1) / onboardingQuestions.length) * 100
    
    return (
      <div className="flex h-screen bg-[#f5f5f7] items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-2xl border border-[#e8e8ed]">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-[#1d1d1f]">Getting to Know You</h2>
              <span className="text-sm text-[#86868b]">{currentQuestionIndex + 1} of {onboardingQuestions.length}</span>
            </div>
            <div className="w-full bg-[#f5f5f7] rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-[#007AFF] to-[#5856D6] h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-lg font-semibold text-[#1d1d1f] mb-3">
              {currentQuestion.question}
            </label>
            {currentQuestion.type === 'textarea' ? (
              <textarea
                value={onboardingAnswers[currentQuestion.id] || ''}
                onChange={(e) => handleOnboardingAnswer(currentQuestion.id, e.target.value)}
                placeholder={currentQuestion.placeholder}
                className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#007AFF] min-h-[120px] resize-none"
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleOnboardingNext()}
              />
            ) : (
              <input
                type="text"
                value={onboardingAnswers[currentQuestion.id] || ''}
                onChange={(e) => handleOnboardingAnswer(currentQuestion.id, e.target.value)}
                placeholder={currentQuestion.placeholder}
                className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                onKeyPress={(e) => e.key === 'Enter' && handleOnboardingNext()}
              />
            )}
          </div>
          
          <div className="flex gap-3">
            {currentQuestionIndex > 0 && (
              <button
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                className="px-6 py-3 rounded-xl bg-white border border-[#e8e8ed] text-[#1d1d1f] font-semibold hover:bg-[#f5f5f7] transition-all"
              >
                Back
              </button>
            )}
            <button
              onClick={handleOnboardingNext}
              disabled={!onboardingAnswers[currentQuestion.id]?.trim()}
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentQuestionIndex === onboardingQuestions.length - 1 ? 'Complete' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Mobile/Tablet UI
  if (isMobile || isTablet) {
    return <MobileUI isTablet={isTablet} />
  }

  return (
    <div className="flex h-screen bg-[#f5f5f7] overflow-hidden">
      {/* Left Sidebar with History Dropdowns */}
      <div className={`${isTablet ? 'w-64' : 'w-72'} glass border-r border-[#e8e8ed] flex flex-col shadow-sm`}>
        <div className="p-6 border-b border-[#e8e8ed]">
          <button
            onClick={() => {
              setActiveView('chat')
              setMessages([])
              setConversationId(null)
            }}
            className="w-full text-left"
          >
            <div className="flex items-center gap-3 mb-1">
              {currentUser?.assistant?.id ? (
                  <img
                  src={`${API_BASE_URL}/api/avatars/${currentUser.assistant.id}`}
                    alt={currentUser.assistant.name || 'AI Assistant'}
                    className="w-8 h-8 rounded-xl object-cover border border-[#e8e8ed]"
                    onError={(e) => {
                      // Fallback to Sparkles icon if avatar fails to load
                      e.currentTarget.style.display = 'none'
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement
                      if (fallback) fallback.style.display = 'flex'
                    }}
                  />
              ) : null}
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center ${currentUser?.assistant?.id ? 'hidden' : ''}`}>
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
              <h1 className="text-xl font-semibold text-[#1d1d1f] hover:text-[#007AFF] transition-colors cursor-pointer leading-tight">Personal AI</h1>
                </div>
            <p className="text-sm text-[#86868b] mt-1.5 leading-relaxed">
              {currentUser?.profile?.name 
                ? `${currentUser.profile.name}'s Personal Assistant`
                : currentUser?.username 
                  ? `${capitalizeUsername(currentUser.username)}'s Personal Assistant`
                  : 'Local AI Service'}
            </p>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* CHAT - Order: 1 */}
          <div className="bg-white border border-[#e8e8ed] rounded-xl overflow-hidden">
            <button
              onClick={() => {
                setActiveView('chat')
                toggleSection('chat')
              }}
              className={`w-full flex items-center justify-between px-4 py-3 transition-all ${
                activeView === 'chat' ? 'bg-[#007AFF]/10' : 'hover:bg-[#f5f5f7]'
              }`}
            >
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#007AFF]" />
                <span className="font-medium text-[#1d1d1f]">CHAT</span>
              </div>
              {expandedSections.chat ? (
                <ChevronUp className="w-4 h-4 text-[#86868b]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#86868b]" />
              )}
            </button>
            {expandedSections.chat && (
              <div className="border-t border-[#e8e8ed]">
                {/* Conversations with Infinite Scroll */}
                <div 
                  ref={conversationsScrollRef}
                  className="max-h-96 overflow-y-auto"
                  onScroll={handleConversationsScroll}
                >
                  {displayedConversations.length === 0 ? (
                    <p className="text-sm text-[#86868b] px-4 py-3">No conversations</p>
                  ) : (
                    <div>
                      {displayedConversations.map((conv) => (
                        <div
                          key={conv.conversation_id}
                          className={`group flex items-center justify-between px-4 py-3 hover:bg-[#f5f5f7] transition-all border-b border-[#e8e8ed] last:border-b-0 ${
                            conversationId === conv.conversation_id ? 'bg-[#007AFF]/10' : ''
                          }`}
                        >
                          <button
                            onClick={() => loadConversation(conv.conversation_id)}
                            className="flex-1 text-left min-w-0 pr-2"
                          >
                            <p className="text-sm font-medium text-[#1d1d1f] truncate">{conv.summary || 'Untitled conversation'}</p>
                            <p className="text-xs text-[#86868b] mt-0.5">{conv.message_count} messages</p>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm('Delete this conversation?')) {
                                deleteConversation(conv.conversation_id)
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all flex-shrink-0"
                          >
                            <X className="w-3 h-3 text-red-600" />
                          </button>
                        </div>
                      ))}
                
                      {/* End of list indicator */}
                      {displayedConversations.length >= allConversations.length && allConversations.length > 0 && (
                        <div className="px-4 py-2 text-center">
                          <p className="text-xs text-[#86868b]">All conversations loaded ({allConversations.length} total)</p>
              </div>
            )}
          </div>
            )}
          </div>

              </div>
            )}
          </div>

          {/* SKILLS - Order: 2 */}
          <div className="bg-white border border-[#e8e8ed] rounded-xl overflow-hidden">
            <button
              onClick={() => {
                setActiveView('skills')
                toggleSection('skills')
              }}
              className={`w-full flex items-center justify-between px-4 py-3 transition-all ${
                activeView === 'skills' ? 'bg-[#FFD700]/10' : 'hover:bg-[#f5f5f7]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#FFD700]" />
                <span className="font-medium text-[#1d1d1f]">SKILLS</span>
              </div>
              {expandedSections.skills ? (
                <ChevronUp className="w-4 h-4 text-[#86868b]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#86868b]" />
              )}
            </button>
            {expandedSections.skills && (
              <div className="border-t border-[#e8e8ed] max-h-96 overflow-y-auto">
                {skills.length === 0 ? (
                  <p className="text-sm text-[#86868b] px-6 py-2">Loading skills...</p>
                ) : (
                  <div>
                    {skills.map((skill) => (
                      <div
                        key={skill.id}
                        className={`w-full flex items-center justify-between px-4 py-3 mx-2 my-1 text-sm transition-all cursor-pointer rounded-full ${
                          selectedSkill?.id === skill.id
                            ? 'bg-gradient-to-r from-[#FFD700]/20 to-[#FFA500]/10 text-[#FFD700] border-2 border-[#FFD700]/50 shadow-md'
                            : 'hover:bg-gradient-to-r hover:from-[#f5f5f7] hover:to-[#fafafa] text-[#1d1d1f] border border-transparent hover:border-[#e8e8ed]'
                        }`}
                        onClick={() => {
                          closeAllExpandedMenus()
                          setSelectedSkill(skill)
                        }}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-base flex-shrink-0">{skill.icon}</span>
                          <span className="truncate font-medium">{skill.name}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                          <div
                            onClick={(e) => {
                              e.stopPropagation()
                              handleNewDocument(skill.id)
                            }}
                            className="p-0.5 hover:opacity-80 transition-opacity cursor-pointer"
                            title="New document"
                          >
                            <span className="text-xs">✨</span>
                          </div>
                          <div
                            onContextMenu={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleOpenFolder(skill.id, e)
                            }}
                            onTouchStart={(e) => {
                              const touchStart = Date.now()
                              const timer = setTimeout(() => {
                                handleOpenFolder(skill.id, e)
                              }, 500)
                              const touchEnd = () => {
                                clearTimeout(timer)
                                document.removeEventListener('touchend', touchEnd)
                              }
                              document.addEventListener('touchend', touchEnd)
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenFolder(skill.id, e)
                            }}
                            className="p-0.5 hover:opacity-80 transition-opacity cursor-pointer"
                            title="Open folder (long press/right click for recent documents)"
                          >
                            <span className="text-xs">📁</span>
                          </div>
                          <div
                            onClick={(e) => {
                              e.stopPropagation()
                              handleLastDocument(skill.id)
                            }}
                            className="p-0.5 hover:opacity-80 transition-opacity cursor-pointer"
                            title="Last document"
                          >
                            <span className="text-xs">🕐</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {selectedSkill && (
                  <div className="border-t border-[#e8e8ed] px-4 py-4">
                    <div className="bg-white border border-[#e8e8ed] rounded-xl p-4">
                      <p className="text-sm font-medium text-[#1d1d1f] mb-3">Task for {selectedSkill.name}</p>
                    <input
                      type="text"
                      value={skillTask}
                      onChange={(e) => {
                        setSkillTask(e.target.value)
                        // Close expanded menus when user starts typing in skill task
                        if (e.target.value.length > 0) {
                          closeAllExpandedMenus()
                        }
                      }}
                      placeholder="Describe what you want to automate..."
                        className="w-full px-3 py-2 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] text-sm focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] transition-all mb-3 placeholder:text-[#86868b]"
                      onKeyPress={(e) => e.key === 'Enter' && handleExecuteSkill()}
                    />
                    <button
                        onClick={() => handleExecuteSkill()}
                      disabled={!skillTask.trim() || executingSkill}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#007AFF] text-white font-medium text-sm hover:bg-[#0051D5] transition-all disabled:opacity-50"
                    >
                      {executingSkill ? 'Executing...' : 'Execute Skill'}
                    </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SONGS - Order: 3 */}
          <div className="bg-white border border-[#e8e8ed] rounded-xl overflow-hidden">
            <button
              onClick={() => {
                setActiveView('songs')
                toggleSection('songs')
              }}
              className={`w-full flex items-center justify-between px-4 py-3 transition-all ${
                activeView === 'songs' ? 'bg-[#FF9500]/10' : 'hover:bg-[#f5f5f7]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-[#FF9500]" />
                <span className="font-medium text-[#1d1d1f]">SONGS</span>
              </div>
              {expandedSections.songs ? (
                <ChevronUp className="w-4 h-4 text-[#86868b]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#86868b]" />
              )}
            </button>
            {expandedSections.songs && (
              <div className="border-t border-[#e8e8ed] p-2 max-h-64 overflow-y-auto">
                {songHistory.length === 0 ? (
                  <p className="text-sm text-[#86868b] px-2 py-2">No songs</p>
                ) : (
                  <div className="space-y-1">
                    {songHistory.map((song) => (
                      <div
                        key={song.song_id}
                        className="group flex items-center justify-between p-2 rounded-lg hover:bg-[#f5f5f7] transition-all"
                      >
                        <button
                          onClick={() => {
                            togglePlayPause(song.song_id)
                          }}
                          className="flex-1 text-left"
                        >
                          <p className="text-sm font-medium text-[#1d1d1f] truncate">{song.prompt}</p>
                          {song.for_fans_of && (
                            <p className="text-xs text-[#86868b]">For fans of: {song.for_fans_of}</p>
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('Delete this song?')) {
                              deleteSong(song.song_id)
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#e8e8ed] transition-all"
                          title="Delete song"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* IMAGES - Order: 4 */}
          <div className="bg-white border border-[#e8e8ed] rounded-xl overflow-hidden">
            <button
              onClick={() => {
                setActiveView('images')
                toggleSection('images')
              }}
              className={`w-full flex items-center justify-between px-4 py-3 transition-all ${
                activeView === 'images' ? 'bg-[#FF2D55]/10' : 'hover:bg-[#f5f5f7]'
              }`}
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#FF2D55]" />
                <span className="font-medium text-[#1d1d1f]">IMAGES</span>
              </div>
              {expandedSections.images ? (
                <ChevronUp className="w-4 h-4 text-[#86868b]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#86868b]" />
              )}
            </button>
            {expandedSections.images && (
              <div className="border-t border-[#e8e8ed] p-2 max-h-64 overflow-y-auto">
                {imageHistory.length === 0 ? (
                  <p className="text-sm text-[#86868b] px-2 py-2">No images</p>
                ) : (
                  <div className="space-y-1">
                    {imageHistory.map((img) => (
                      <div
                        key={img.file_id}
                        className="group flex items-center gap-2 p-2 rounded-lg hover:bg-[#f5f5f7] transition-all"
                      >
                        <button
                          onClick={() => {
                            const file: UploadedFile = {
                              id: img.file_id,
                              type: 'image',
                              filename: img.filename,
                              url: `${API_BASE_URL}${img.url}`
                            }
                            setSelectedFile(file)
                          }}
                          className="flex-1 text-left min-w-0"
                        >
                          <p className="text-sm font-medium text-[#1d1d1f] truncate">{img.filename}</p>
                          <p className="text-xs text-[#86868b] truncate">{img.dimensions.width}x{img.dimensions.height}</p>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('Delete this image?')) {
                              deleteImage(img.file_id)
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all flex-shrink-0"
                        >
                          <X className="w-3 h-3 text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* VIDEOS - Order: 5 */}
          <div className="bg-white border border-[#e8e8ed] rounded-xl overflow-hidden">
            <button
              onClick={() => {
                setActiveView('videos')
                toggleSection('videos')
              }}
              className={`w-full flex items-center justify-between px-4 py-3 transition-all ${
                activeView === 'videos' ? 'bg-[#5856D6]/10' : 'hover:bg-[#f5f5f7]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-[#5856D6]" />
                <span className="font-medium text-[#1d1d1f]">VIDEOS</span>
              </div>
              {expandedSections.videos ? (
                <ChevronUp className="w-4 h-4 text-[#86868b]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#86868b]" />
              )}
            </button>
            {expandedSections.videos && (
              <div className="border-t border-[#e8e8ed] p-2 max-h-64 overflow-y-auto">
                {videoHistory.length === 0 ? (
                  <p className="text-sm text-[#86868b] px-2 py-2">No videos</p>
                ) : (
                  <div className="space-y-1">
                    {videoHistory.map((vid) => (
                      <div
                        key={vid.file_id}
                        className="group flex items-center gap-2 p-2 rounded-lg hover:bg-[#f5f5f7] transition-all"
                      >
                        <button
                          onClick={() => {
                            const file: UploadedFile = {
                              id: vid.file_id,
                              type: 'video',
                              filename: vid.filename,
                              url: `${API_BASE_URL}${vid.url}`
                            }
                            setSelectedFile(file)
                          }}
                          className="flex-1 text-left min-w-0"
                        >
                          <p className="text-sm font-medium text-[#1d1d1f] truncate">{vid.filename}</p>
                          <p className="text-xs text-[#86868b] truncate">{vid.duration.toFixed(1)}s • {vid.dimensions.width}x{vid.dimensions.height}</p>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('Delete this video?')) {
                              deleteVideo(vid.file_id)
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all flex-shrink-0"
                        >
                          <X className="w-3 h-3 text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ASSISTANTS - Order: 6 (Parent Folder) */}
          <div className="bg-white border border-[#e8e8ed] rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('assistants')}
              className={`w-full flex items-center justify-between px-4 py-3 transition-all ${
                activeView === 'assistants' ? 'bg-[#007AFF]/10' : 'hover:bg-[#f5f5f7]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#007AFF]" />
                <span className="font-medium text-[#1d1d1f]">ASSISTANTS</span>
              </div>
              {expandedSections.assistants ? (
                <ChevronUp className="w-4 h-4 text-[#86868b]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#86868b]" />
              )}
            </button>
            {expandedSections.assistants && (
              <div className="border-t border-[#e8e8ed]">
                <button
                  onClick={() => {
                    setActiveView('assistants')
                    toggleSection('assistants')
                  }}
                  className={`w-full flex items-center justify-between px-6 py-2 text-sm transition-all ${
                    activeView === 'assistants' ? 'bg-[#007AFF]/10 text-[#007AFF]' : 'hover:bg-[#f5f5f7] text-[#1d1d1f]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span>Create & Manage</span>
                  </div>
                </button>
                {assistants.length > 0 && (
                  <div className="px-6 py-2 max-h-64 overflow-y-auto">
                    {assistants.map((assistant) => (
                      <button
                        key={assistant.id}
                        onClick={() => {
                          setSelectedAssistant(assistant)
                          setActiveView('assistants')
                        }}
                        className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[#f5f5f7] transition-all mb-1"
                      >
                        <p className="font-medium text-[#1d1d1f]">{assistant.name}</p>
                        <p className="text-xs text-[#86868b] truncate">{assistant.description || assistant.summary}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* WALLETS - Order: 7 (Parent Folder) */}
          <div className="bg-white border border-[#e8e8ed] rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('wallet')}
              className={`w-full flex items-center justify-between px-4 py-3 transition-all ${
                activeView === 'wallet' || activeView === 'solana' ? 'bg-[#F7931A]/10' : 'hover:bg-[#f5f5f7]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Bitcoin className="w-4 h-4 text-[#F7931A]" />
                <span className="font-medium text-[#1d1d1f]">WALLETS</span>
              </div>
              {expandedSections.wallet ? (
                <ChevronUp className="w-4 h-4 text-[#86868b]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#86868b]" />
              )}
            </button>
            {expandedSections.wallet && (
              <div className="border-t border-[#e8e8ed]">
                <button
                  onClick={() => {
                    setActiveView('wallet')
                  }}
                  className={`w-full flex items-center justify-between px-6 py-2 text-sm transition-all ${
                    activeView === 'wallet' ? 'bg-[#F7931A]/10 text-[#F7931A]' : 'hover:bg-[#f5f5f7] text-[#1d1d1f]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Bitcoin className="w-4 h-4" />
                    <span>Bitcoin</span>
                  </div>
                  {walletBalances && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleBalanceDisplay('bitcoin')
                      }}
                      className="text-xs font-medium hover:opacity-80 transition-all"
                      title="Click to toggle USD/native"
                    >
                      {loadingBalances ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        formatBalance('bitcoin', walletBalances)
                      )}
                    </button>
                  )}
                </button>
                <button
                  onClick={() => {
                    setActiveView('solana')
                  }}
                  className={`w-full flex items-center justify-between px-6 py-2 text-sm transition-all ${
                    activeView === 'solana' ? 'bg-[#14F195]/10 text-[#14F195]' : 'hover:bg-[#f5f5f7] text-[#1d1d1f]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#14F195]" />
                    <span>Solana</span>
                  </div>
                  {walletBalances && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleBalanceDisplay('solana')
                      }}
                      className="text-xs font-medium hover:opacity-80 transition-all"
                      title="Click to toggle USD/native"
                    >
                      {loadingBalances ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        formatBalance('solana', walletBalances)
                      )}
                    </button>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="glass border-b border-[#e8e8ed] shadow-sm">
          <div className="px-6 py-3">
            <div className="flex items-center justify-end">
              <div className="flex items-center gap-3">
                {/* Progress Logs Button */}
                {progressLogs.length > 0 && (
                  <button
                    onClick={() => setShowProgressLogs(!showProgressLogs)}
                    className="relative p-2 rounded-xl bg-white border border-[#e8e8ed] hover:bg-[#f5f5f7] transition-all"
                    title="View Progress Logs"
                  >
                    <Loader2 className={`w-5 h-5 text-[#007AFF] ${progressLogs.some(log => log.status === 'in_progress') ? 'animate-spin' : ''}`} />
                    {progressLogs.filter(log => log.status === 'in_progress' || log.status === 'pending').length > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {progressLogs.filter(log => log.status === 'in_progress' || log.status === 'pending').length}
                      </span>
                    )}
                  </button>
                )}
                
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 rounded-xl bg-white border border-[#e8e8ed] hover:bg-[#f5f5f7] transition-all"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5 text-[#1d1d1f]" />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {notifications.length}
                      </span>
                    )}
                  </button>
                  
                  {showNotifications && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-[#e8e8ed] rounded-xl shadow-lg overflow-hidden z-50 max-h-96 overflow-y-auto">
                      <div className="p-4 border-b border-[#e8e8ed]">
                        <h3 className="font-semibold text-[#1d1d1f]">Notifications</h3>
                      </div>
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-[#86868b] text-sm">No notifications</div>
                      ) : (
                        <div className="divide-y divide-[#e8e8ed]">
                          {notifications.map((notif) => (
                            <div key={notif.id} className="p-4 hover:bg-[#f5f5f7] transition-all">
                              <p className="text-sm text-[#1d1d1f]">{notif.message}</p>
                              <p className="text-xs text-[#86868b] mt-1">{new Date(notif.timestamp).toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* User Settings Dropdown with Profile Picture */}
                <div className="relative">
                  <button
                    onClick={() => setExpandedSections(prev => ({ ...prev, settings: !prev.settings }))}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#e8e8ed] hover:bg-[#f5f5f7] transition-all"
                  >
                    {profilePicture ? (
                      <img 
                        src={profilePicture} 
                        alt="Profile" 
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                    <User className="w-4 h-4 text-[#1d1d1f]" />
                    )}
                    <span className="text-sm font-medium text-[#1d1d1f]">
                      {currentUser?.profile?.name || (currentUser?.username ? capitalizeUsername(currentUser.username) : 'User')}
                    </span>
                    {expandedSections.settings ? (
                      <ChevronUp className="w-4 h-4 text-[#86868b]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#86868b]" />
                    )}
                  </button>
                  
                  {expandedSections.settings && (
                    <>
                      {/* Backdrop with heavy blur */}
                      <div 
                        className="fixed inset-0 bg-black/20 backdrop-blur-[20px] z-[9998]"
                        onClick={() => setExpandedSections(prev => ({ ...prev, settings: false }))}
                      />
                      {/* Dropdown menu - always on top */}
                      <div className="absolute right-0 top-full mt-2 w-72 bg-white/95 backdrop-blur-xl border border-[#e8e8ed] rounded-xl shadow-2xl overflow-hidden z-[9999]">
                        <div className="p-2">
                        {/* User Info with Profile Picture */}
                        <div className="px-3 py-2 text-sm text-[#86868b] border-b border-[#e8e8ed] mb-2">
                          <div className="flex items-center gap-3 mb-2">
                            {profilePicture ? (
                              <img 
                                src={profilePicture} 
                                alt="Profile" 
                                className="w-12 h-12 rounded-full object-cover border border-[#e8e8ed]"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-[#e8e8ed] flex items-center justify-center">
                                <User className="w-6 h-6 text-[#86868b]" />
                              </div>
                            )}
                            <div className="flex-1">
                          <p className="font-medium text-[#1d1d1f]">{currentUser?.profile?.name || (currentUser?.username ? capitalizeUsername(currentUser.username) : 'User')}</p>
                          <p className="text-xs">{currentUser?.username ? capitalizeUsername(currentUser.username) : ''}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => profilePictureInputRef.current?.click()}
                            disabled={uploadingProfilePicture}
                            className="w-full px-3 py-2 text-xs bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-lg transition-all disabled:opacity-50"
                          >
                            {uploadingProfilePicture ? 'Uploading...' : 'Change Profile Picture'}
                          </button>
                          <input
                            ref={profilePictureInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleProfilePictureUpload}
                            className="hidden"
                          />
                        </div>

                        {/* Total Account Value */}
                        <div className="px-3 py-2 mb-2 bg-gradient-to-br from-[#007AFF]/10 to-[#5856D6]/10 rounded-lg border border-[#007AFF]/20">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-[#86868b] mb-0.5">Total Account Value</p>
                              {loadingTotalValue ? (
                                <Loader2 className="w-4 h-4 text-[#007AFF] animate-spin" />
                              ) : (
                                <p className="text-lg font-semibold text-[#1d1d1f]">
                                  ${totalAccountValue?.total_value_usd?.toFixed(2) || '0.00'}
                                </p>
                              )}
                            </div>
                            <Bitcoin className="w-6 h-6 text-[#F7931A]" />
                          </div>
                        </div>

                        {/* Quick Access Icons */}
                        <div className="grid grid-cols-4 gap-2 mb-2">
                          <button
                            onClick={() => {
                              setExpandedSections(prev => ({ ...prev, settings: false, wallet: true }))
                              setActiveView('wallet')
                            }}
                            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-[#f5f5f7] transition-all group"
                            title="Bitcoin Wallets"
                          >
                            <Bitcoin className="w-5 h-5 text-[#F7931A] group-hover:scale-110 transition-transform" />
                            <span className="text-xs text-[#86868b]">Bitcoin</span>
                          </button>
                          <button
                            onClick={() => {
                              setExpandedSections(prev => ({ ...prev, settings: false, wallet: true }))
                              setActiveView('solana')
                            }}
                            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-[#f5f5f7] transition-all group"
                            title="Solana Wallet"
                          >
                            <div className="w-3 h-3 rounded-full bg-[#14F195] group-hover:scale-110 transition-transform" />
                            <span className="text-xs text-[#86868b]">Solana</span>
                          </button>
                          <button
                            onClick={() => {
                              setExpandedSections(prev => ({ ...prev, settings: false, skills: true }))
                              setActiveView('skills')
                            }}
                            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-[#f5f5f7] transition-all group"
                            title="Skills"
                          >
                            <Zap className="w-5 h-5 text-[#FFD700] group-hover:scale-110 transition-transform" />
                            <span className="text-xs text-[#86868b]">Skills</span>
                          </button>
                          <button
                            onClick={() => {
                              setExpandedSections(prev => ({ ...prev, settings: false, chat: true }))
                              setActiveView('chat')
                            }}
                            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-[#f5f5f7] transition-all group"
                            title="Chat"
                          >
                            <History className="w-5 h-5 text-[#007AFF] group-hover:scale-110 transition-transform" />
                            <span className="text-xs text-[#86868b]">Chat</span>
                          </button>
                        </div>

                        {/* Sign Out */}
                        <button
                          onClick={() => {
                            setExpandedSections(prev => ({ ...prev, settings: false }))
                            handleSignOut()
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all flex items-center gap-2 mt-1"
                        >
                          <X className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Main Content Area - Conditional Views */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-4xl mx-auto">
            {/* Personal AI Assistant Header - Show for all views */}
            {currentUser?.assistant?.name && (
              <div className="mb-6 pb-4 border-b border-[#e8e8ed]">
                <div className="flex items-center gap-3">
                  {currentUser.assistant.id && (
                    <img
                      src={`${API_BASE_URL}/api/avatars/${currentUser.assistant.id}`}
                      alt={currentUser.assistant.name}
                      className="w-12 h-12 rounded-xl object-cover border border-[#e8e8ed]"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                  <div>
                    <h2 className="text-xl font-semibold text-[#1d1d1f]">{currentUser.assistant.name}</h2>
                    <p className="text-sm text-[#86868b]">Your Personal AI Assistant</p>
                  </div>
                </div>
              </div>
            )}
            {/* Bitcoin Wallet View */}
            {activeView === 'wallet' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F7931A] to-[#FFA500] flex items-center justify-center">
                      <Bitcoin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-[#1d1d1f]">Bitcoin Wallets</h2>
                      <p className="text-sm text-[#86868b]">BTC, BCH, and BSV addresses</p>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-[#e8e8ed]">
                  <button
                    onClick={() => setWalletTab('wallets')}
                    className={`px-4 py-2 font-medium text-sm transition-all border-b-2 ${
                      walletTab === 'wallets'
                        ? 'text-[#F7931A] border-[#F7931A]'
                        : 'text-[#86868b] border-transparent hover:text-[#1d1d1f]'
                    }`}
                  >
                    Wallets
                  </button>
                  <button
                    onClick={() => setWalletTab('tokens')}
                    className={`px-4 py-2 font-medium text-sm transition-all border-b-2 ${
                      walletTab === 'tokens'
                        ? 'text-[#F7931A] border-[#F7931A]'
                        : 'text-[#86868b] border-transparent hover:text-[#1d1d1f]'
                    }`}
                  >
                    Tokens
                  </button>
                  <button
                    onClick={() => setWalletTab('nfts')}
                    className={`px-4 py-2 font-medium text-sm transition-all border-b-2 ${
                      walletTab === 'nfts'
                        ? 'text-[#F7931A] border-[#F7931A]'
                        : 'text-[#86868b] border-transparent hover:text-[#1d1d1f]'
                    }`}
                  >
                    NFTs
                  </button>
                </div>

                {loadingWallet ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-[#F7931A] animate-spin" />
                  </div>
                ) : wallet ? (
                  <>
                    {walletTab === 'wallets' && (
                      <div className="space-y-4">
                        {/* Info Note */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                          <p className="text-sm text-blue-800">
                            <strong>Note:</strong> All three coins (BTC, BCH, BSV) share the same WIF private key and address.
                          </p>
                        </div>
                        
                        {/* Wallet Grid - Smaller Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* BTC Wallet Card */}
                          <div className="bg-white border border-[#e8e8ed] rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-[#F7931A]/10 flex items-center justify-center">
                                  <Bitcoin className="w-4 h-4 text-[#F7931A]" />
                                </div>
                                <h3 className="font-semibold text-[#1d1d1f]">BTC</h3>
                              </div>
                            </div>
                            <div className="mb-3">
                              <p className="text-xs text-[#86868b] mb-1">Address</p>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-mono text-[#1d1d1f] truncate flex-1">
                                  {wallet.addresses?.BTC ? `${wallet.addresses.BTC.substring(0, 8)}...${wallet.addresses.BTC.substring(wallet.addresses.BTC.length - 6)}` : 'No address'}
                                </p>
                                <button
                                  onClick={() => {
                                    if (wallet.addresses?.BTC) {
                                      navigator.clipboard.writeText(wallet.addresses.BTC)
                                      alert('Address copied!')
                                    }
                                  }}
                                  className="p-1 hover:bg-[#f5f5f7] rounded transition-all"
                                  title="Copy address"
                                >
                                  <Copy className="w-4 h-4 text-[#86868b]" />
                                </button>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  if (wallet.addresses?.BTC) {
                                    window.open(`${API_BASE_URL}/api/wallet/qr-code/${wallet.addresses.BTC}`, '_blank')
                                  }
                                }}
                                className="flex-1 px-3 py-2 text-xs bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-lg transition-all"
                              >
                                QR Code
                              </button>
                            </div>
                          </div>

                          {/* BCH Wallet Card */}
                          <div className="bg-white border border-[#e8e8ed] rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-[#0AC18E]/10 flex items-center justify-center">
                                  <Bitcoin className="w-4 h-4 text-[#0AC18E]" />
                                </div>
                                <h3 className="font-semibold text-[#1d1d1f]">BCH</h3>
                              </div>
                            </div>
                            <div className="mb-3">
                              <p className="text-xs text-[#86868b] mb-1">Address</p>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-mono text-[#1d1d1f] truncate flex-1">
                                  {wallet.addresses?.BCH ? `${wallet.addresses.BCH.substring(0, 8)}...${wallet.addresses.BCH.substring(wallet.addresses.BCH.length - 6)}` : 'No address'}
                                </p>
                                <button
                                  onClick={() => {
                                    if (wallet.addresses?.BCH) {
                                      navigator.clipboard.writeText(wallet.addresses.BCH)
                                      alert('Address copied!')
                                    }
                                  }}
                                  className="p-1 hover:bg-[#f5f5f7] rounded transition-all"
                                  title="Copy address"
                                >
                                  <Copy className="w-4 h-4 text-[#86868b]" />
                                </button>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  if (wallet.addresses?.BCH) {
                                    window.open(`${API_BASE_URL}/api/wallet/qr-code/${wallet.addresses.BCH}`, '_blank')
                                  }
                                }}
                                className="flex-1 px-3 py-2 text-xs bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-lg transition-all"
                              >
                                QR Code
                              </button>
                            </div>
                          </div>

                          {/* BSV Wallet Card */}
                          <div className="bg-white border border-[#e8e8ed] rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-[#EAB300]/10 flex items-center justify-center">
                                  <Bitcoin className="w-4 h-4 text-[#EAB300]" />
                                </div>
                                <h3 className="font-semibold text-[#1d1d1f]">BSV</h3>
                              </div>
                            </div>
                            <div className="mb-3">
                              <p className="text-xs text-[#86868b] mb-1">Address</p>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-mono text-[#1d1d1f] truncate flex-1">
                                  {wallet.addresses?.BSV ? `${wallet.addresses.BSV.substring(0, 8)}...${wallet.addresses.BSV.substring(wallet.addresses.BSV.length - 6)}` : 'No address'}
                                </p>
                                <button
                                  onClick={() => {
                                    if (wallet.addresses?.BSV) {
                                      navigator.clipboard.writeText(wallet.addresses.BSV)
                                      alert('Address copied!')
                                    }
                                  }}
                                  className="p-1 hover:bg-[#f5f5f7] rounded transition-all"
                                  title="Copy address"
                                >
                                  <Copy className="w-4 h-4 text-[#86868b]" />
                                </button>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  if (wallet.addresses?.BSV) {
                                    window.open(`${API_BASE_URL}/api/wallet/qr-code/${wallet.addresses.BSV}`, '_blank')
                                  }
                                }}
                                className="flex-1 px-3 py-2 text-xs bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-lg transition-all"
                              >
                                QR Code
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                          <button
                            onClick={handleDownloadWallet}
                            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#0051D5] text-white font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                          >
                            <Download className="w-5 h-5" />
                            Download Private Key
                          </button>
                          <button
                            onClick={handleRegenerateWallet}
                            disabled={regeneratingWallet}
                            className="px-4 py-3 rounded-xl bg-white border border-[#e8e8ed] text-[#1d1d1f] font-semibold hover:bg-[#f5f5f7] transition-all flex items-center gap-2 disabled:opacity-50"
                          >
                            {regeneratingWallet ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <RefreshCw className="w-5 h-5" />
                            )}
                            Regenerate
                          </button>
                        </div>
                      </div>
                    )}

                    {walletTab === 'tokens' && (
                      <div className="space-y-4">
                        {loadingTokens ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-[#F7931A] animate-spin" />
                          </div>
                        ) : walletTokens.length === 0 ? (
                          <div className="bg-white border border-[#e8e8ed] rounded-xl p-12 text-center">
                            <p className="text-[#86868b]">No tokens found. Tokens will appear here when detected.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {walletTokens.map((token: Token) => (
                              <div key={token.id} className="bg-white border border-[#e8e8ed] rounded-xl p-4">
                                <div className="flex items-center gap-3 mb-2">
                                  {token.image && (
                                    <img src={token.image} alt={token.name} className="w-10 h-10 rounded-lg" />
                                  )}
                                  <div className="flex-1">
                                    <p className="font-semibold text-[#1d1d1f]">{token.name}</p>
                                    <p className="text-xs text-[#86868b]">{token.symbol}</p>
                                  </div>
                                </div>
                                <p className="text-lg font-semibold text-[#1d1d1f]">{token.balance}</p>
                                {token.value_usd && (
                                  <p className="text-sm text-[#86868b]">${token.value_usd.toFixed(2)}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {walletTab === 'nfts' && (
                      <div className="space-y-4">
                        {loadingNfts ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-[#F7931A] animate-spin" />
                          </div>
                        ) : walletNfts.length === 0 ? (
                          <div className="bg-white border border-[#e8e8ed] rounded-xl p-12 text-center">
                            <p className="text-[#86868b]">No NFTs/Ordinals found. They will appear here when detected.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {walletNfts.map((nft: NFT) => (
                              <div key={nft.id} className="bg-white border border-[#e8e8ed] rounded-xl overflow-hidden">
                                {nft.image && (
                                  <img src={nft.image} alt={nft.name} className="w-full aspect-square object-cover" />
                                )}
                                <div className="p-3">
                                  <p className="font-semibold text-[#1d1d1f] text-sm truncate">{nft.name}</p>
                                  {nft.collection && (
                                    <p className="text-xs text-[#86868b] truncate">{nft.collection}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-[#86868b]">Failed to load wallet</p>
                  </div>
                )}
              </div>
            ) : messages.length === 0 && activeView === 'chat' ? (
              <div className="flex items-center justify-center h-full animate-fade-in">
                <div className="text-center max-w-2xl">
                  {currentUser?.assistant?.id ? (
                    <div className="relative mb-8">
                      <img
                        src={`${API_BASE_URL}/api/avatars/${currentUser.assistant.id}`}
                        alt={currentUser.assistant.name || 'AI Assistant'}
                        className="w-32 h-32 rounded-3xl object-cover mx-auto shadow-2xl border-2 border-[#e8e8ed] animate-pulse"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement
                          if (fallback) fallback.style.display = 'flex'
                        }}
                      />
                      {/* Waiting indicator dots */}
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                        <div className="w-2 h-2 bg-[#007AFF] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-2 h-2 bg-[#007AFF] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-[#007AFF] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  ) : null}
                  <div className={`w-32 h-32 rounded-3xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center mx-auto mb-8 shadow-2xl ${currentUser?.assistant?.id ? 'hidden' : ''}`}>
                    <Sparkles className="w-16 h-16 text-white" />
                  </div>
                  <h2 className="text-apple-title text-[#1d1d1f] mb-2">
                    {currentUser?.assistant?.name ? `Hi! I'm ${currentUser.assistant.name}` : 'Welcome to Personal AI'}
                  </h2>
                  <p className="text-lg text-[#515154] mb-6 leading-relaxed">
                    {conversations.length > 0 
                      ? "Ready to continue where we left off?"
                      : "I'm here to help. What would you like to work on today?"}
                  </p>
                  {conversations.length > 0 && (
                    <div className="mb-8">
                      <button
                        onClick={() => {
                          const lastConv = conversations[0]
                          if (lastConv) loadConversation(lastConv.conversation_id)
                        }}
                        className="px-6 py-3 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] text-white font-semibold hover:opacity-90 transition-all"
                      >
                        Continue Last Conversation
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : activeView === 'chat' ? (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in group`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className={`relative max-w-2xl rounded-2xl px-5 py-4 shadow-sm ${
                      message.role === 'user'
                        ? 'bg-[#007AFF] text-white'
                        : 'bg-white border border-[#e8e8ed] text-[#1d1d1f]'
                    }`}
                  >
                    <button
                      onClick={() => deleteMessage(message.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center transition-all hover:bg-black/10"
                      title="Delete message"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                    <p className="whitespace-pre-wrap leading-relaxed text-[15px] pr-6">{message.content}</p>
                    {message.generatedImageIds && message.generatedImageIds.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-[#e8e8ed] space-y-2">
                        {message.generatedImageIds.map((imageId) => (
                          <img
                            key={imageId}
                            src={`${API_BASE_URL}/api/image/${imageId}`}
                            alt="Generated image"
                            className="max-w-full rounded-lg shadow-sm"
                            style={{ maxHeight: '500px' }}
                          />
                        ))}
                      </div>
                    )}
                    {message.audioUrl && (
                      <div className="mt-4 pt-4 border-t border-[#e8e8ed]">
                        <audio 
                          controls 
                          className="w-full"
                          src={message.audioUrl}
                          style={{ maxWidth: '100%' }}
                        >
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-white border border-[#e8e8ed] rounded-2xl px-5 py-4 shadow-sm">
                    <Loader2 className="w-5 h-5 text-[#007AFF] animate-spin" />
                  </div>
                </div>
              )}
            </div>
            ) : activeView === 'solana' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#14F195] to-[#9945FF] flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-[#1d1d1f]">Solana Wallet</h2>
                      <p className="text-sm text-[#86868b]">SOL and token balances</p>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-[#e8e8ed]">
                  <button
                    onClick={() => setWalletTab('wallets')}
                    className={`px-4 py-2 font-medium text-sm transition-all border-b-2 ${
                      walletTab === 'wallets'
                        ? 'text-[#14F195] border-[#14F195]'
                        : 'text-[#86868b] border-transparent hover:text-[#1d1d1f]'
                    }`}
                  >
                    Wallets
                  </button>
                  <button
                    onClick={() => setWalletTab('tokens')}
                    className={`px-4 py-2 font-medium text-sm transition-all border-b-2 ${
                      walletTab === 'tokens'
                        ? 'text-[#14F195] border-[#14F195]'
                        : 'text-[#86868b] border-transparent hover:text-[#1d1d1f]'
                    }`}
                  >
                    Tokens
                  </button>
                  <button
                    onClick={() => setWalletTab('nfts')}
                    className={`px-4 py-2 font-medium text-sm transition-all border-b-2 ${
                      walletTab === 'nfts'
                        ? 'text-[#14F195] border-[#14F195]'
                        : 'text-[#86868b] border-transparent hover:text-[#1d1d1f]'
                    }`}
                  >
                    NFTs
                  </button>
                </div>

                {loadingWallet ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-[#14F195] animate-spin" />
                  </div>
                ) : wallet ? (
                  <>
                    {walletTab === 'wallets' && (
                      <div className="space-y-4">
                        {/* Solana Wallet Card */}
                        <div className="bg-white border border-[#e8e8ed] rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-[#14F195]/10 flex items-center justify-center">
                                <div className="w-4 h-4 rounded-full bg-[#14F195]" />
                              </div>
                              <h3 className="font-semibold text-[#1d1d1f]">SOL</h3>
                            </div>
                          </div>
                          <div className="mb-3">
                            <p className="text-xs text-[#86868b] mb-1">Address</p>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-mono text-[#1d1d1f] truncate flex-1">
                                {solanaWallet.address ? `${solanaWallet.address.substring(0, 8)}...${solanaWallet.address.substring(solanaWallet.address.length - 6)}` : 'No address'}
                              </p>
                              <button
                                onClick={() => {
                                  if (solanaWallet.address) {
                                    navigator.clipboard.writeText(solanaWallet.address)
                                    alert('Address copied!')
                                  }
                                }}
                                className="p-1 hover:bg-[#f5f5f7] rounded transition-all"
                                title="Copy address"
                              >
                                <Copy className="w-4 h-4 text-[#86868b]" />
                              </button>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (solanaWallet.address) {
                                  window.open(`${API_BASE_URL}/api/wallet/qr-code/${solanaWallet.address}`, '_blank')
                                }
                              }}
                              className="flex-1 px-3 py-2 text-xs bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-lg transition-all"
                            >
                              QR Code
                            </button>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                          <button
                            onClick={async () => {
                              if (!authToken) return
                              try {
                                const response = await axios.get(`${API_BASE_URL}/api/wallet/solana`, {
                                  headers: { Authorization: `Bearer ${authToken}` }
                                })
                                const walletData = response.data
                                const blob = new Blob([JSON.stringify(walletData, null, 2)], { type: 'application/json' })
                                const url = URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = url
                                a.download = 'solana_wallet.json'
                                a.click()
                                URL.revokeObjectURL(url)
                              } catch (error: unknown) {
                                alert(`Failed to download wallet: ${error.response?.data?.detail || error.message}`)
                              }
                            }}
                            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#0051D5] text-white font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                          >
                            <Download className="w-5 h-5" />
                            Download Private Key
                          </button>
                          <button
                            onClick={async () => {
                              if (!authToken || !confirm('Are you sure you want to regenerate your Solana wallet? This will create a new wallet and you will lose access to the old one.')) return
                              setRegeneratingWallet(true)
                              try {
                                await axios.post(`${API_BASE_URL}/api/wallet/solana/regenerate`, {}, {
                                  headers: { Authorization: `Bearer ${authToken}` }
                                })
                                await loadSolanaWallet()
                                alert('Wallet regenerated successfully!')
                              } catch (error: unknown) {
                                alert(`Failed to regenerate wallet: ${error.response?.data?.detail || error.message}`)
                              } finally {
                                setRegeneratingWallet(false)
                              }
                            }}
                            disabled={regeneratingWallet}
                            className="px-4 py-3 rounded-xl bg-white border border-[#e8e8ed] text-[#1d1d1f] font-semibold hover:bg-[#f5f5f7] transition-all flex items-center gap-2 disabled:opacity-50"
                          >
                            {regeneratingWallet ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <RefreshCw className="w-5 h-5" />
                            )}
                            Regenerate
                          </button>
                        </div>
                      </div>
                    )}

                    {walletTab === 'tokens' && (
                      <div className="space-y-4">
                        {loadingTokens ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-[#14F195] animate-spin" />
                          </div>
                        ) : walletTokens.length === 0 ? (
                          <div className="bg-white border border-[#e8e8ed] rounded-xl p-12 text-center">
                            <p className="text-[#86868b]">No tokens found. Tokens will appear here when detected.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {walletTokens.map((token: Token) => (
                              <div key={token.id} className="bg-white border border-[#e8e8ed] rounded-xl p-4">
                                <div className="flex items-center gap-3 mb-2">
                                  {token.image && (
                                    <img src={token.image} alt={token.name} className="w-10 h-10 rounded-lg" />
                                  )}
                                  <div className="flex-1">
                                    <p className="font-semibold text-[#1d1d1f]">{token.name}</p>
                                    <p className="text-xs text-[#86868b]">{token.symbol}</p>
                                  </div>
                                </div>
                                <p className="text-lg font-semibold text-[#1d1d1f]">{token.balance}</p>
                                {token.value_usd && (
                                  <p className="text-sm text-[#86868b]">${token.value_usd.toFixed(2)}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {walletTab === 'nfts' && (
                      <div className="space-y-4">
                        {loadingNfts ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-[#14F195] animate-spin" />
                          </div>
                        ) : walletNfts.length === 0 ? (
                          <div className="bg-white border border-[#e8e8ed] rounded-xl p-12 text-center">
                            <p className="text-[#86868b]">No NFTs found. NFTs will appear here when detected.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {walletNfts.map((nft: NFT) => (
                              <div key={nft.id} className="bg-white border border-[#e8e8ed] rounded-xl overflow-hidden">
                                {nft.image && (
                                  <img src={nft.image} alt={nft.name} className="w-full aspect-square object-cover" />
                                )}
                                <div className="p-3">
                                  <p className="font-semibold text-[#1d1d1f] text-sm truncate">{nft.name}</p>
                                  {nft.collection && (
                                    <p className="text-xs text-[#86868b] truncate">{nft.collection}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-[#86868b]">Failed to load wallet</p>
                  </div>
                )}
              </div>
            ) : activeView === 'assistants' ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-[#1d1d1f]">Automation Assistants</h2>
                    <p className="text-sm text-[#86868b]">Background assistants that automate tasks on your computer</p>
                  </div>
                </div>

                {/* Create New Assistant */}
                <div className="bg-white border border-[#e8e8ed] rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-[#1d1d1f] mb-4">Create New Assistant</h3>
                  <div className="space-y-4">
                    <textarea
                      value={assistantDescription}
                      onChange={(e) => setAssistantDescription(e.target.value)}
                      placeholder="Describe the task you want automated. For example: 'Monitor my email and send me a notification when important messages arrive' or 'Automatically organize downloaded files into folders by type'..."
                      className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#007AFF] min-h-[120px] resize-none"
                      rows={4}
                    />
                    <button
                      onClick={createAssistant}
                      disabled={!assistantDescription.trim() || creatingAssistant}
                      className="w-full px-6 py-3 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {creatingAssistant ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Creating Assistant...
                        </>
                      ) : (
                        <>
                          <Zap className="w-5 h-5" />
                          Create Assistant
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Existing Assistants */}
                {assistants.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[#1d1d1f]">Your Assistants</h3>
                    {assistants.map((assistant) => (
                      <div
                        key={assistant.id}
                        className={`bg-white border rounded-xl p-6 transition-all ${
                          selectedAssistant?.id === assistant.id
                            ? 'border-[#007AFF] bg-[#007AFF]/5'
                            : 'border-[#e8e8ed] hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center">
                                <Zap className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-[#1d1d1f]">{assistant.name}</h4>
                                <p className="text-xs text-[#86868b]">
                                  {assistant.status === 'active' ? '🟢 Running' : assistant.status === 'paused' ? '⏸️ Paused' : '⚪ Stopped'}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-[#86868b] mt-2">{assistant.description}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => {
                              setSelectedAssistant(assistant)
                              setActiveView('chat')
                              // Start conversation about this assistant
                              const message: Message = {
                                id: Date.now().toString(),
                                role: 'assistant',
                                content: `I'm ready to help you build and configure the "${assistant.name}" assistant. Let's discuss the details and I'll guide you through the implementation step by step, similar to how Cursor helps build applications.`,
                                timestamp: new Date(),
                              }
                              setMessages([message])
                            }}
                            className="px-4 py-2 rounded-lg bg-[#007AFF] text-white text-sm font-semibold hover:opacity-90 transition-all"
                          >
                            Configure with AI
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const newStatus = assistant.status === 'active' ? 'paused' : 'active'
                                await axios.post(`${API_BASE_URL}/api/assistants/${assistant.id}/toggle`, {
                                  status: newStatus
                                }, {
                                  headers: { Authorization: `Bearer ${authToken}` }
                                })
                                loadAssistants()
                              } catch (error: unknown) {
                                alert(`Failed to toggle assistant: ${error.response?.data?.detail || error.message}`)
                              }
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                              assistant.status === 'active'
                                ? 'bg-[#FF9500] text-white hover:opacity-90'
                                : 'bg-[#34C759] text-white hover:opacity-90'
                            }`}
                          >
                            {assistant.status === 'active' ? 'Pause' : 'Start'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeView === 'projects' ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
                    <Code className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-[#1d1d1f]">Projects</h2>
                    <p className="text-sm text-[#86868b]">Connect Cursor projects for review</p>
                  </div>
                </div>

                {/* Cursor API Key Input */}
                <div className="bg-white border border-[#e8e8ed] rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-[#1d1d1f] mb-4">Cursor API Configuration</h3>
                  <div className="space-y-3">
                    <input
                      type="password"
                      value={cursorApiKey}
                      onChange={(e) => setCursorApiKey(e.target.value)}
                      placeholder="Enter Cursor API Key"
                      className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                    />
                    <button
                      onClick={async () => {
                        if (!cursorApiKey.trim()) {
                          alert('Please enter a Cursor API key')
                          return
                        }
                        setLoadingProjects(true)
                        try {
                          const response = await axios.post(`${API_BASE_URL}/api/projects/connect`, {
                            api_key: cursorApiKey,
                            provider: 'cursor'
                          }, {
                            headers: { Authorization: `Bearer ${authToken}` }
                          })
                          setProjects(response.data.projects || [])
                          alert('Cursor projects connected successfully!')
                        } catch (error: unknown) {
                          alert(`Failed to connect: ${error.response?.data?.detail || error.message}`)
                        } finally {
                          setLoadingProjects(false)
                        }
                      }}
                      disabled={loadingProjects || !cursorApiKey.trim()}
                      className="px-4 py-2 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {loadingProjects ? 'Connecting...' : 'Connect Cursor Projects'}
                    </button>
                  </div>
                </div>

                {/* Projects List */}
                {projects.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[#1d1d1f]">Your Projects</h3>
                    {projects.map((project: Project) => (
                      <div key={project.id} className="bg-white border border-[#e8e8ed] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-[#1d1d1f]">{project.name}</h4>
                          <button
                            onClick={async () => {
                              try {
                                const response = await axios.post(`${API_BASE_URL}/api/projects/review`, {
                                  project_id: project.id
                                }, {
                                  headers: { Authorization: `Bearer ${authToken}` }
                                })
                                const reviewMessage: Message = {
                                  id: Date.now().toString(),
                                  role: 'assistant',
                                  content: response.data.review,
                                  timestamp: new Date(),
                                }
                                setMessages([reviewMessage])
                                setActiveView('chat')
                              } catch (error: unknown) {
                                alert(`Failed to review project: ${error.response?.data?.detail || error.message}`)
                              }
                            }}
                            className="px-4 py-2 rounded-lg bg-[#6366F1] text-white text-sm font-semibold hover:opacity-90 transition-all"
                          >
                            Review with AI
                          </button>
                        </div>
                        <p className="text-sm text-[#86868b]">{project.description || 'No description'}</p>
                        {project.last_modified && (
                          <p className="text-xs text-[#86868b] mt-2">Last modified: {new Date(project.last_modified).toLocaleDateString()}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeView === 'skills' ? (
              <div className="space-y-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-[#1d1d1f] mb-1 leading-tight">Skills</h2>
                  <p className="text-sm text-[#86868b] leading-relaxed">Automate tasks with your Personal AI</p>
                  </div>

                {/* Skill Finder Chat Box */}
                <div className="bg-white border border-[#e8e8ed] rounded-2xl p-6 shadow-sm">
                  <div className="mb-5">
                    <h3 className="font-semibold text-base text-[#1d1d1f] mb-1.5">What do you need help with?</h3>
                    <p className="text-sm text-[#86868b] leading-relaxed">Describe your issue and I'll find the right skill for you</p>
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={skillIssueQuery}
                      onChange={(e) => setSkillIssueQuery(e.target.value)}
                      placeholder="e.g., I need to track my expenses, organize my calendar, manage my emails..."
                      className="flex-1 px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] transition-all text-[15px] placeholder:text-[#86868b]"
                      onKeyPress={(e) => e.key === 'Enter' && !findingSkill && findSkillForIssue(skillIssueQuery)}
                    />
                    <button
                      onClick={() => findSkillForIssue(skillIssueQuery)}
                      disabled={!skillIssueQuery.trim() || findingSkill}
                      className="px-5 py-3 rounded-xl bg-[#007AFF] text-white font-medium hover:bg-[#0051D5] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {findingSkill ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Find
                        </>
                      )}
                    </button>
                  </div>
                  {skillSuggestion && (
                    <div className={`mt-4 p-4 rounded-xl border ${
                      skillSuggestion.skill 
                        ? 'bg-[#f0f9ff] border-[#007AFF]/20' 
                        : 'bg-[#fffbeb] border-[#fbbf24]/20'
                    }`}>
                      <div className="flex items-start gap-3">
                        {skillSuggestion.skill ? (
                          <>
                            <span className="text-2xl flex-shrink-0 leading-none">{skillSuggestion.skill.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#1d1d1f] mb-1 leading-relaxed">{skillSuggestion.message}</p>
                              <p className="text-xs text-[#86868b] mt-1 leading-relaxed">{skillSuggestion.skill.description}</p>
                              <button
                                onClick={() => {
                                  setSkillTask('')
                                  setExpandedSkills(prev => new Set(prev).add(skillSuggestion.skill!.id))
                                }}
                                className="mt-3 px-4 py-2 rounded-xl bg-[#007AFF] text-white font-medium text-xs hover:bg-[#0051D5] transition-all"
                              >
                                Use This Skill
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5 text-[#f59e0b] flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm text-[#1d1d1f] leading-relaxed">{skillSuggestion.message}</p>
                            </div>
                          </>
                        )}
                        <button
                          onClick={() => setSkillSuggestion(null)}
                          className="p-1 hover:bg-black/5 rounded-lg transition-colors flex-shrink-0"
                        >
                          <X className="w-4 h-4 text-[#86868b]" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Skills Grid */}
                {skills.length === 0 ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 text-[#FFD700] animate-spin mx-auto mb-4" />
                    <p className="text-[#86868b]">Loading skills...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {skills.map((skill) => {
                      const isFavorite = favoriteSkills.includes(skill.id)
                      const isExpanded = expandedSkills.has(skill.id)
                      return (
                        <div
                          key={skill.id}
                          className={`bg-white border rounded-2xl p-5 transition-all hover:shadow-md cursor-pointer flex flex-col min-h-[140px] ${
                            selectedSkill?.id === skill.id
                              ? 'border-[#007AFF] bg-[#007AFF]/5 shadow-sm'
                              : 'border-[#e8e8ed] hover:border-[#e0e0e0]'
                          }`}
                          onClick={() => {
                            setExpandedSkills(prev => {
                              const newSet = new Set(prev)
                              if (newSet.has(skill.id)) {
                                newSet.delete(skill.id)
                              } else {
                                newSet.add(skill.id)
                              }
                              return newSet
                            })
                          }}
                        >
                          <div className="flex items-center gap-4 mb-3 flex-shrink-0">
                            <span className="text-4xl flex-shrink-0 leading-none">{skill.icon}</span>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base text-[#1d1d1f] leading-tight whitespace-nowrap overflow-hidden text-ellipsis">{skill.name}</h3>
                              {skill.category && (
                                <p className="text-xs text-[#86868b] mt-0.5 leading-relaxed">{skill.category}</p>
                              )}
                            </div>
                          </div>
                          <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out flex-shrink-0 ${
                              isExpanded ? 'max-h-96 opacity-100 mb-3' : 'max-h-0 opacity-0'
                            }`}
                          >
                            <div className="w-full pt-3 border-t border-[#e8e8ed]">
                              <p className="text-sm text-[#1d1d1f] mb-4 leading-relaxed font-normal">{skill.description}</p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // Navigate to skill-specific view
                                  if (skill.id === 'todo_list') {
                                    setActiveView('todo_list')
                                    loadTodos()
                                  } else if (skill.id === 'bills') {
                                    setActiveView('bills')
                                    loadBills()
                                  } else if (skill.id === 'budget') {
                                    setActiveView('budget')
                                    loadBudget()
                                  } else if (skill.id === 'expense_calculator') {
                                    setActiveView('expense_calculator')
                                    loadExpenses()
                                  } else if (skill.id === 'business_manager') {
                                    setActiveView('business_manager')
                                    loadBusiness()
                                  } else if (skill.id === 'meal_planning') {
                                    setActiveView('meal_planning')
                                    loadMealPlans()
                                  } else if (skill.id === 'crm') {
                                    setActiveView('crm')
                                    loadCRMData()
                                  } else if (skill.id === 'bsv_inscribe') {
                                    setActiveView('bsv_inscribe')
                                  } else {
                                    // For all other skills, navigate to skill page
                                    openSkillPage(skill)
                                  }
                                }}
                                disabled={executingSkill}
                                className="w-full px-5 py-2.5 rounded-xl bg-[#007AFF] text-white font-medium text-sm hover:bg-[#0051D5] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                {executingSkill && selectedSkill?.id === skill.id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Executing...
                                  </>
                                ) : (
                                  'Use Skill'
                                )}
                              </button>
                            </div>
                          </div>
                          <div className="flex-1"></div>
                          <div className="flex items-center justify-center gap-2 pt-3 border-t border-[#e8e8ed] flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleNewDocument(skill.id)
                              }}
                              className="p-1.5 hover:bg-[#f5f5f7] rounded-lg transition-colors"
                              title="New document"
                            >
                              <span className="text-base leading-none">✨</span>
                            </button>
                            <button
                              onContextMenu={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleOpenFolder(skill.id, e)
                              }}
                              onTouchStart={(e) => {
                                const touchStart = Date.now()
                                const timer = setTimeout(() => {
                                  handleOpenFolder(skill.id, e)
                                }, 500)
                                const touchEnd = () => {
                                  clearTimeout(timer)
                                  document.removeEventListener('touchend', touchEnd)
                                }
                                document.addEventListener('touchend', touchEnd)
                              }}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenFolder(skill.id, e)
                              }}
                              className="p-1.5 hover:bg-[#f5f5f7] rounded-lg transition-colors"
                              title="Open folder (long press/right click for recent documents)"
                            >
                              <span className="text-base leading-none">📁</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleLastDocument(skill.id)
                              }}
                              className="p-1.5 hover:bg-[#f5f5f7] rounded-lg transition-colors"
                              title="Last document"
                            >
                              <span className="text-base leading-none">🕐</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleFavoriteSkill(skill.id)
                              }}
                              className={`w-8 h-8 rounded-full transition-all flex items-center justify-center shadow-sm hover:shadow-md ${
                                isFavorite
                                  ? 'bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-white border-2 border-[#FFD700]'
                                  : 'bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border border-gray-200 text-[#86868b]'
                              }`}
                              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                              <Zap className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Selected Skill Task Input */}
                {selectedSkill && (
                  <div className="mt-8 bg-white border border-[#e8e8ed] rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-4 mb-5">
                      <span className="text-4xl leading-none">{selectedSkill.icon}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-[#1d1d1f] leading-tight">{selectedSkill.name}</h3>
                        <p className="text-sm text-[#86868b] mt-1 leading-relaxed">{selectedSkill.description}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={skillTask}
                        onChange={(e) => setSkillTask(e.target.value)}
                        placeholder="Describe what you want to automate..."
                        className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] transition-all text-[15px] placeholder:text-[#86868b]"
                        onKeyPress={(e) => e.key === 'Enter' && handleExecuteSkill()}
                      />
                      <button
                        onClick={() => handleExecuteSkill()}
                        disabled={!skillTask.trim() || executingSkill}
                        className="w-full px-5 py-3 rounded-xl bg-[#007AFF] text-white font-medium hover:bg-[#0051D5] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {executingSkill ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Executing...
                          </>
                        ) : (
                          'Execute Skill'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : activeView === 'todo_list' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#34C759] to-[#30D158] flex items-center justify-center">
                      <span className="text-2xl">✅</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-[#1d1d1f]">To Do List</h2>
                      <p className="text-sm text-[#86868b]">Manage your tasks and stay organized</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowThings3Settings(!showThings3Settings)
                      if (!showThings3Settings) {
                        loadThings3Settings()
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-[#007AFF] text-white text-sm font-medium hover:bg-[#0051D5] transition-all flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    {things3Settings.configured ? 'Things 3 ✓' : 'Connect Things 3'}
                  </button>
                </div>

                {/* Things 3 Settings */}
                {showThings3Settings && (
                  <div className="bg-white border border-[#e8e8ed] rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-[#1d1d1f]">Things 3 Integration</h3>
                        <p className="text-sm text-[#86868b] mt-1">
                          Connect your Things 3 inbox email to automatically add tasks with AI formatting
                        </p>
                      </div>
                      <button
                        onClick={() => setShowThings3Settings(false)}
                        className="text-[#86868b] hover:text-[#1d1d1f]"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
                          Things 3 Inbox Email
                        </label>
                        <input
                          type="email"
                          value={things3Settings.inbox_email || ''}
                          onChange={(e) => setThings3Settings({ ...things3Settings, inbox_email: e.target.value })}
                          placeholder="your-inbox@things.email"
                          className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                        />
                        <p className="text-xs text-[#86868b] mt-1">
                          This is your Things 3 inbox email (not your registration email)
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
                            SMTP Host
                          </label>
                          <input
                            type="text"
                            value={things3Settings.smtp_host || 'smtp.gmail.com'}
                            onChange={(e) => setThings3Settings({ ...things3Settings, smtp_host: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
                            SMTP Port
                          </label>
                          <input
                            type="number"
                            value={things3Settings.smtp_port || 587}
                            onChange={(e) => setThings3Settings({ ...things3Settings, smtp_port: parseInt(e.target.value) })}
                            className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
                          SMTP Username (Your Email)
                        </label>
                        <input
                          type="email"
                          value={things3Settings.smtp_user || ''}
                          onChange={(e) => setThings3Settings({ ...things3Settings, smtp_user: e.target.value })}
                          placeholder="your-email@gmail.com"
                          className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
                          SMTP Password (App Password)
                        </label>
                        <input
                          type="password"
                          value={things3Settings.smtp_password || ''}
                          onChange={(e) => setThings3Settings({ ...things3Settings, smtp_password: e.target.value })}
                          placeholder="Your app password"
                          className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                        />
                        <p className="text-xs text-[#86868b] mt-1">
                          For Gmail, use an App Password (not your regular password)
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={saveThings3Settings}
                          className="flex-1 px-4 py-3 rounded-xl bg-[#007AFF] text-white font-medium hover:bg-[#0051D5] transition-all"
                        >
                          Save Settings
                        </button>
                        <button
                          onClick={testThings3Connection}
                          disabled={testingThings3 || !things3Settings.configured}
                          className="px-4 py-3 rounded-xl bg-[#34C759] text-white font-medium hover:bg-[#30D158] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {testingThings3 ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Test Connection'}
                        </button>
                      </div>
                      {things3Settings.configured && (
                        <div className="bg-[#34C759]/10 border border-[#34C759] rounded-xl p-3 text-sm text-[#34C759]">
                          ✓ Things 3 is connected! Tasks will automatically be sent to your Things 3 inbox.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Add New Todo */}
                <div className="bg-white border border-[#e8e8ed] rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-[#1d1d1f] mb-4">Add New Task</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newTodoTask}
                      onChange={(e) => setNewTodoTask(e.target.value)}
                      placeholder="Enter a new task..."
                      className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#34C759]"
                      onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <select
                        value={newTodoPriority}
                        onChange={(e) => setNewTodoPriority(e.target.value as 'low' | 'medium' | 'high')}
                        className="px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#34C759]"
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                      </select>
                      <input
                        type="date"
                        value={newTodoDueDate}
                        onChange={(e) => setNewTodoDueDate(e.target.value)}
                        placeholder="Due date (optional)"
                        className="px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#34C759]"
                      />
                      <input
                        type="text"
                        value={newTodoCategory}
                        onChange={(e) => setNewTodoCategory(e.target.value)}
                        placeholder="Category (optional)"
                        className="px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#34C759]"
                      />
                    </div>
                    <button
                      onClick={addTodo}
                      disabled={!newTodoTask.trim()}
                      className="w-full px-6 py-3 rounded-xl bg-[#34C759] text-white font-medium hover:bg-[#30D158] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Task
                    </button>
                  </div>
                </div>

                {/* Todos List */}
                {loadingTodos ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 text-[#34C759] animate-spin mx-auto mb-4" />
                    <p className="text-[#86868b]">Loading tasks...</p>
                  </div>
                ) : todos.length === 0 ? (
                  <div className="bg-white border border-[#e8e8ed] rounded-xl p-12 text-center">
                    <span className="text-4xl mb-4 block">📝</span>
                    <p className="text-[#86868b] text-lg">No tasks yet. Add one above to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Search, Filters and Sort */}
                    <div className="bg-white border border-[#e8e8ed] rounded-xl p-4 space-y-3">
                      <input
                        type="text"
                        value={todoSearch}
                        onChange={(e) => setTodoSearch(e.target.value)}
                        placeholder="Search tasks..."
                        className="w-full px-4 py-2 rounded-lg bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#34C759] text-sm"
                      />
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-[#86868b]">Filter:</span>
                          <select
                            value={todoFilter}
                            onChange={(e) => setTodoFilter(e.target.value as 'all' | 'pending' | 'completed')}
                            className="px-3 py-2 rounded-lg bg-[#f5f5f7] border border-[#e8e8ed] text-sm focus:outline-none focus:ring-2 focus:ring-[#34C759]"
                          >
                            <option value="all">All ({todos.length})</option>
                            <option value="pending">Pending ({todos.filter(t => !t.completed).length})</option>
                            <option value="completed">Completed ({todos.filter(t => t.completed).length})</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-[#86868b]">Sort:</span>
                          <select
                            value={todoSort}
                            onChange={(e) => setTodoSort(e.target.value as 'date' | 'priority' | 'name')}
                            className="px-3 py-2 rounded-lg bg-[#f5f5f7] border border-[#e8e8ed] text-sm focus:outline-none focus:ring-2 focus:ring-[#34C759]"
                          >
                            <option value="date">Date</option>
                            <option value="priority">Priority</option>
                            <option value="name">Name</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress Summary */}
                    {todos.length > 0 && (
                      <div className="bg-[#34C759] rounded-xl p-4 text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm opacity-90">Progress</p>
                            <p className="text-2xl font-semibold">
                              {Math.round((todos.filter(t => t.completed).length / todos.length) * 100)}%
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm opacity-90">
                              {todos.filter(t => t.completed).length} of {todos.length} completed
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 w-full bg-white/20 rounded-full h-2">
                          <div
                            className="bg-white rounded-full h-2 transition-all"
                            style={{ width: `${(todos.filter(t => t.completed).length / todos.length) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Todos List */}
                    {getFilteredAndSortedTodos().length === 0 ? (
                      <div className="bg-white border border-[#e8e8ed] rounded-xl p-12 text-center">
                        <span className="text-4xl mb-4 block">📝</span>
                        <p className="text-[#86868b] text-lg">
                          {todoFilter === 'pending' ? 'No pending tasks!' :
                           todoFilter === 'completed' ? 'No completed tasks yet!' :
                           'No tasks yet. Add one above to get started!'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {getFilteredAndSortedTodos().map((todo) => {
                          const isEditing = editingTodo === todo.id
                          const isOverdue = todo.due_date && !todo.completed && new Date(todo.due_date) < new Date()
                          
                          return (
                          <div
                            key={todo.id}
                              className={`bg-white border rounded-xl p-4 transition-all group ${
                                todo.completed ? 'opacity-60' : 'hover:shadow-sm'
                              } ${isOverdue ? 'border-red-300 bg-red-50' : 'border-[#e8e8ed]'}`}
                            >
                              {isEditing ? (
                                <div className="space-y-3">
                                  <input
                                    type="text"
                                    value={editTodoTask}
                                    onChange={(e) => setEditTodoTask(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#34C759]"
                                    autoFocus
                                  />
                                  <div className="grid grid-cols-2 gap-2">
                                    <select
                                      value={editTodoPriority}
                                      onChange={(e) => setEditTodoPriority(e.target.value as 'low' | 'medium' | 'high')}
                                      className="px-3 py-2 rounded-lg bg-[#f5f5f7] border border-[#e8e8ed] text-sm focus:outline-none focus:ring-2 focus:ring-[#34C759]"
                                    >
                                      <option value="low">Low Priority</option>
                                      <option value="medium">Medium Priority</option>
                                      <option value="high">High Priority</option>
                                    </select>
                                    <input
                                      type="date"
                                      value={editTodoDueDate}
                                      onChange={(e) => setEditTodoDueDate(e.target.value)}
                                      className="px-3 py-2 rounded-lg bg-[#f5f5f7] border border-[#e8e8ed] text-sm focus:outline-none focus:ring-2 focus:ring-[#34C759]"
                                    />
                                  </div>
                                  <input
                                    type="text"
                                    value={editTodoCategory}
                                    onChange={(e) => setEditTodoCategory(e.target.value)}
                                    placeholder="Category (optional)"
                                    className="w-full px-3 py-2 rounded-lg bg-[#f5f5f7] border border-[#e8e8ed] text-sm focus:outline-none focus:ring-2 focus:ring-[#34C759]"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => editTodo(todo.id)}
                                      className="flex-1 px-4 py-2 rounded-xl bg-[#34C759] text-white font-medium hover:bg-[#30D158] transition-all"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={cancelEditTodo}
                                      className="px-4 py-2 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] hover:bg-[#e8e8ed] transition-all font-medium"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleTodoComplete(todo.id)}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                                      todo.completed
                                        ? 'bg-[#34C759]'
                                        : 'border-2 border-[#34C759] hover:bg-[#34C759]/10'
                                    }`}
                                  >
                                    {todo.completed && <span className="text-white text-sm">✓</span>}
                            </button>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-[#1d1d1f] font-medium ${todo.completed ? 'line-through' : ''}`}>
                                      {todo.task}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                      {todo.category && (
                                        <span className="text-xs px-2 py-0.5 rounded-lg bg-[#e8e8ed] text-[#86868b] border border-[#e0e0e0]">
                                          {todo.category}
                                        </span>
                                      )}
                                      {todo.priority && (
                                        <span className={`text-xs px-2 py-0.5 rounded-lg border ${getPriorityColor(todo.priority)}`}>
                                          {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
                                        </span>
                                      )}
                                      {todo.due_date && (
                                        <span className={`text-xs px-2 py-0.5 rounded-lg ${
                                          isOverdue ? 'bg-red-100 text-red-700 border border-red-200' :
                                          'bg-[#f5f5f7] text-[#86868b] border border-[#e8e8ed]'
                                        }`}>
                                          📅 {new Date(todo.due_date).toLocaleDateString()}
                                          {isOverdue && ' (Overdue)'}
                                        </span>
                                      )}
                                      {todo.created_at && (
                                        <span className="text-xs text-[#86868b]">
                                          Created: {new Date(todo.created_at).toLocaleDateString()}
                                        </span>
                              )}
                            </div>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => startEditTodo(todo)}
                                      className="p-2 hover:bg-blue-100 rounded-lg transition-all"
                                      title="Edit task"
                                    >
                                      <Settings className="w-4 h-4 text-blue-600" />
                                    </button>
                            <button
                              onClick={() => deleteTodo(todo.id)}
                                      className="p-2 hover:bg-red-100 rounded-lg transition-all"
                                      title="Delete task"
                            >
                              <X className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                      </div>
                    )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : activeView === 'expense_calculator' ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF9500] to-[#FF6B00] flex items-center justify-center">
                    <span className="text-2xl">💸</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-[#1d1d1f]">Expense Calculator</h2>
                    <p className="text-sm text-[#86868b]">Track and calculate your expenses</p>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-[#e8e8ed] rounded-xl p-4">
                    <p className="text-sm text-[#86868b] mb-1">Total Expenses</p>
                    <p className="text-2xl font-semibold text-[#1d1d1f]">${calculateTotal().toFixed(2)}</p>
                  </div>
                  <div className="bg-white border border-[#e8e8ed] rounded-xl p-4">
                    <p className="text-sm text-[#86868b] mb-1">Total Count</p>
                    <p className="text-2xl font-semibold text-[#1d1d1f]">{expenses.length}</p>
                  </div>
                  <div className="bg-white border border-[#e8e8ed] rounded-xl p-4">
                    <p className="text-sm text-[#86868b] mb-1">Categories</p>
                    <p className="text-2xl font-semibold text-[#1d1d1f]">{Object.keys(calculateByCategory()).length}</p>
                  </div>
                </div>

                {/* Add New Expense */}
                <div className="bg-white border border-[#e8e8ed] rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-[#1d1d1f] mb-4">Add New Expense</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-[#1d1d1f] mb-1">Amount ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newExpenseAmount}
                          onChange={(e) => setNewExpenseAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#FF9500]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#1d1d1f] mb-1">Category</label>
                        <input
                          type="text"
                          value={newExpenseCategory}
                          onChange={(e) => setNewExpenseCategory(e.target.value)}
                          placeholder="e.g., Food, Transport"
                          className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#FF9500]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1d1d1f] mb-1">Description (optional)</label>
                      <input
                        type="text"
                        value={newExpenseDescription}
                        onChange={(e) => setNewExpenseDescription(e.target.value)}
                        placeholder="What was this expense for?"
                        className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#FF9500]"
                        onKeyPress={(e) => e.key === 'Enter' && addExpense()}
                      />
                    </div>
                            <button
                      onClick={addExpense}
                      disabled={!newExpenseAmount.trim() || !newExpenseCategory.trim()}
                      className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF9500] to-[#FF6B00] text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                      Add Expense
                            </button>
                  </div>
                </div>

                {/* Expenses List */}
                {loadingExpenses ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 text-[#FF9500] animate-spin mx-auto mb-4" />
                    <p className="text-[#86868b]">Loading expenses...</p>
                  </div>
                ) : expenses.length === 0 ? (
                  <div className="bg-white border border-[#e8e8ed] rounded-xl p-12 text-center">
                    <span className="text-4xl mb-4 block">💸</span>
                    <p className="text-[#86868b] text-lg">No expenses yet. Add one above to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Category Breakdown */}
                    <div className="bg-white border border-[#e8e8ed] rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-[#1d1d1f] mb-4">Category Breakdown</h3>
                      <div className="space-y-2">
                        {Object.entries(calculateByCategory())
                          .sort(([, a], [, b]) => (b as number) - (a as number))
                          .map(([category, total]) => (
                            <div key={category} className="flex items-center justify-between py-2 border-b border-[#e8e8ed] last:border-b-0">
                              <span className="text-[#1d1d1f] font-medium capitalize">{category}</span>
                              <span className="text-[#1d1d1f] font-semibold">${(total as number).toFixed(2)}</span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Recent Expenses */}
                    <div className="bg-white border border-[#e8e8ed] rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-[#1d1d1f] mb-4">Recent Expenses</h3>
                      <div className="space-y-2">
                        {expenses
                          .sort((a: Expense, b: Expense) => new Date(b.created_at || b.date || 0).getTime() - new Date(a.created_at || a.date || 0).getTime())
                          .slice(0, 20)
                          .map((expense: Expense) => (
                            <div
                              key={expense.id}
                              className="flex items-center justify-between p-4 border border-[#e8e8ed] rounded-xl hover:shadow-sm transition-all"
                            >
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="px-2 py-1 text-xs font-medium bg-[#FF9500]/10 text-[#FF9500] rounded capitalize">
                                    {expense.category || 'other'}
                                  </span>
                                  <span className="text-lg font-semibold text-[#1d1d1f]">${(expense.amount || 0).toFixed(2)}</span>
                                </div>
                                {expense.description && (
                                  <p className="text-sm text-[#86868b]">{expense.description}</p>
                                )}
                                {expense.date && (
                                <p className="text-xs text-[#86868b] mt-1">
                                    {new Date(expense.date).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteExpense(expense.id)
                              }}
                              className="ml-4 p-2 hover:bg-[#FF3B30]/10 rounded-lg transition-colors text-[#FF3B30] hover:text-[#FF3B30] flex-shrink-0"
                              title="Delete expense"
                            >
                              <span className="text-lg leading-none">×</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : activeView === 'business_manager' ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5856D6] to-[#7B68EE] flex items-center justify-center">
                    <span className="text-2xl">🏢</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-[#1d1d1f]">Business Manager</h2>
                    <p className="text-sm text-[#86868b]">Complete business dashboard with expense and income tracking</p>
                  </div>
                </div>

                {loadingBusiness ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 text-[#5856D6] animate-spin mx-auto mb-4" />
                    <p className="text-[#86868b]">Loading business data...</p>
                  </div>
                ) : (
                  <>
                    {/* Key Metrics Dashboard */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-white border border-[#e8e8ed] rounded-xl p-5">
                        <p className="text-sm text-[#86868b] mb-1">Total Income</p>
                        <p className="text-2xl font-semibold text-[#34C759]">
                          ${(businessData?.total_income || 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-white border border-[#e8e8ed] rounded-xl p-5">
                        <p className="text-sm text-[#86868b] mb-1">Total Expenses</p>
                        <p className="text-2xl font-semibold text-[#FF3B30]">
                          ${(businessData?.total_expenses || 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-white border border-[#e8e8ed] rounded-xl p-5">
                        <p className="text-sm text-[#86868b] mb-1">Profit</p>
                        <p className={`text-2xl font-semibold ${(businessData?.profit || 0) >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                          ${(businessData?.profit || 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-white border border-[#e8e8ed] rounded-xl p-5">
                        <p className="text-sm text-[#86868b] mb-1">Customers</p>
                        <p className="text-2xl font-semibold text-[#1d1d1f]">
                          {businessData?.customer_count || 0}
                        </p>
                      </div>
                    </div>

                    {/* Add Expense & Income Forms */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Add Expense */}
                      <div className="bg-white border border-[#e8e8ed] rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-[#1d1d1f] mb-4">Add Expense</h3>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-[#1d1d1f] mb-1">Amount ($)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={newBusinessExpenseAmount}
                                onChange={(e) => setNewBusinessExpenseAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#FF3B30]"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#1d1d1f] mb-1">Category</label>
                              <input
                                type="text"
                                value={newBusinessExpenseCategory}
                                onChange={(e) => setNewBusinessExpenseCategory(e.target.value)}
                                placeholder="e.g., Supplies, Rent"
                                className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#FF3B30]"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#1d1d1f] mb-1">Description</label>
                            <input
                              type="text"
                              value={newBusinessExpenseDescription}
                              onChange={(e) => setNewBusinessExpenseDescription(e.target.value)}
                              placeholder="What was this expense for?"
                              className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#FF3B30]"
                              onKeyPress={(e) => e.key === 'Enter' && addBusinessExpense()}
                            />
                          </div>
                          <button
                            onClick={addBusinessExpense}
                            disabled={!newBusinessExpenseAmount.trim() || !newBusinessExpenseCategory.trim()}
                            className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF3B30] to-[#FF6B6B] text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Add Expense
                          </button>
                        </div>
                      </div>

                      {/* Add Income */}
                      <div className="bg-white border border-[#e8e8ed] rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-[#1d1d1f] mb-4">Add Income</h3>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-[#1d1d1f] mb-1">Amount ($)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={newBusinessIncomeAmount}
                                onChange={(e) => setNewBusinessIncomeAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#34C759]"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#1d1d1f] mb-1">Source</label>
                              <input
                                type="text"
                                value={newBusinessIncomeSource}
                                onChange={(e) => setNewBusinessIncomeSource(e.target.value)}
                                placeholder="e.g., Sales, Services"
                                className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#34C759]"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#1d1d1f] mb-1">Description</label>
                            <input
                              type="text"
                              value={newBusinessIncomeDescription}
                              onChange={(e) => setNewBusinessIncomeDescription(e.target.value)}
                              placeholder="What was this income from?"
                              className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#34C759]"
                              onKeyPress={(e) => e.key === 'Enter' && addBusinessIncome()}
                            />
                          </div>
                          <button
                            onClick={addBusinessIncome}
                            disabled={!newBusinessIncomeAmount.trim() || !newBusinessIncomeSource.trim()}
                            className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-[#34C759] to-[#30D158] text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Add Income
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Category Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Expense Categories */}
                      <div className="bg-white border border-[#e8e8ed] rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-[#1d1d1f] mb-4">Expense Categories</h3>
                        <div className="space-y-2">
                          {Object.entries(businessData?.expense_categories || {})
                            .sort(([, a]: [string, number], [, b]: [string, number]) => b - a)
                            .map(([category, total]: [string, any]) => (
                              <div key={category} className="flex items-center justify-between py-2 border-b border-[#e8e8ed] last:border-b-0">
                                <span className="text-[#1d1d1f] font-medium capitalize">{category}</span>
                                <span className="text-[#FF3B30] font-semibold">${total.toFixed(2)}</span>
                              </div>
                            ))}
                          {Object.keys(businessData?.expense_categories || {}).length === 0 && (
                            <p className="text-sm text-[#86868b] text-center py-4">No expenses yet</p>
                          )}
                        </div>
                      </div>

                      {/* Income Sources */}
                      <div className="bg-white border border-[#e8e8ed] rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-[#1d1d1f] mb-4">Income Sources</h3>
                        <div className="space-y-2">
                          {Object.entries(businessData?.income_sources || {})
                            .sort(([, a]: [string, number], [, b]: [string, number]) => b - a)
                            .map(([source, total]: [string, any]) => (
                              <div key={source} className="flex items-center justify-between py-2 border-b border-[#e8e8ed] last:border-b-0">
                                <span className="text-[#1d1d1f] font-medium capitalize">{source}</span>
                                <span className="text-[#34C759] font-semibold">${total.toFixed(2)}</span>
                              </div>
                            ))}
                          {Object.keys(businessData?.income_sources || {}).length === 0 && (
                            <p className="text-sm text-[#86868b] text-center py-4">No income yet</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Recent Transactions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Recent Expenses */}
                      <div className="bg-white border border-[#e8e8ed] rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-[#1d1d1f] mb-4">Recent Expenses</h3>
                        <div className="space-y-2">
                          {(businessData?.expenses || [])
                            .slice(-10)
                            .reverse()
                            .map((expense: Expense) => (
                              <div
                                key={expense.id}
                                className="flex items-center justify-between p-3 border border-[#e8e8ed] rounded-xl hover:shadow-sm transition-all"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-1 text-xs font-medium bg-[#FF3B30]/10 text-[#FF3B30] rounded capitalize">
                                      {expense.category || 'other'}
                                    </span>
                                    <span className="text-base font-semibold text-[#1d1d1f]">${(expense.amount || 0).toFixed(2)}</span>
                                  </div>
                                  {expense.description && (
                                    <p className="text-sm text-[#86868b]">{expense.description}</p>
                                  )}
                                </div>
                                <button
                                  onClick={() => deleteBusinessExpense(expense.id)}
                                  className="ml-4 p-2 hover:bg-[#FF3B30]/10 rounded-lg transition-colors text-[#FF3B30] flex-shrink-0"
                                  title="Delete expense"
                                >
                                  <span className="text-lg leading-none">×</span>
                                </button>
                              </div>
                            ))}
                          {(businessData?.expenses || []).length === 0 && (
                            <p className="text-sm text-[#86868b] text-center py-4">No expenses yet</p>
                          )}
                        </div>
                      </div>

                      {/* Recent Income */}
                      <div className="bg-white border border-[#e8e8ed] rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-[#1d1d1f] mb-4">Recent Income</h3>
                        <div className="space-y-2">
                          {(businessData?.income || [])
                            .slice(-10)
                            .reverse()
                            .map((income: { source: string; amount: number; date: string }) => (
                              <div
                                key={income.id}
                                className="flex items-center justify-between p-3 border border-[#e8e8ed] rounded-xl hover:shadow-sm transition-all"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-1 text-xs font-medium bg-[#34C759]/10 text-[#34C759] rounded capitalize">
                                      {income.source || 'other'}
                                    </span>
                                    <span className="text-base font-semibold text-[#1d1d1f]">${(income.amount || 0).toFixed(2)}</span>
                                  </div>
                                  {income.description && (
                                    <p className="text-sm text-[#86868b]">{income.description}</p>
                                  )}
                                </div>
                                <button
                                  onClick={() => deleteBusinessIncome(income.id)}
                                  className="ml-4 p-2 hover:bg-[#FF3B30]/10 rounded-lg transition-colors text-[#FF3B30] flex-shrink-0"
                                  title="Delete income"
                                >
                                  <span className="text-lg leading-none">×</span>
                                </button>
                              </div>
                            ))}
                          {(businessData?.income || []).length === 0 && (
                            <p className="text-sm text-[#86868b] text-center py-4">No income yet</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Customers & Operating Hours */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Customers */}
                      <div className="bg-white border border-[#e8e8ed] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-[#1d1d1f]">Customers</h3>
                          <button
                            onClick={() => {
                              setNewCustomerName('')
                              setNewCustomerEmail('')
                              setNewCustomerPhone('')
                              setNewCustomerAddress('')
                              setNewCustomerNotes('')
                            }}
                            className="text-sm text-[#007AFF] hover:underline"
                          >
                            + Add Customer
                          </button>
                        </div>
                        <div className="space-y-3 mb-4">
                          <input
                            type="text"
                            value={newCustomerName}
                            onChange={(e) => setNewCustomerName(e.target.value)}
                            placeholder="Customer Name"
                            className="w-full px-4 py-2 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#5856D6]"
                          />
                          <input
                            type="email"
                            value={newCustomerEmail}
                            onChange={(e) => setNewCustomerEmail(e.target.value)}
                            placeholder="Email (optional)"
                            className="w-full px-4 py-2 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#5856D6]"
                          />
                          <input
                            type="tel"
                            value={newCustomerPhone}
                            onChange={(e) => setNewCustomerPhone(e.target.value)}
                            placeholder="Phone (optional)"
                            className="w-full px-4 py-2 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#5856D6]"
                          />
                          <button
                            onClick={addBusinessCustomer}
                            disabled={!newCustomerName.trim()}
                            className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-[#5856D6] to-[#7B68EE] text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                          >
                            Add Customer
                          </button>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {(businessData?.customers || []).map((customer: { name: string; email?: string; phone?: string; address?: string; notes?: string }) => (
                            <div
                              key={customer.id}
                              className="flex items-center justify-between p-3 border border-[#e8e8ed] rounded-xl"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-[#1d1d1f]">{customer.name}</p>
                                {customer.email && (
                                  <p className="text-sm text-[#86868b]">{customer.email}</p>
                                )}
                              </div>
                              <button
                                onClick={() => deleteBusinessCustomer(customer.id)}
                                className="ml-2 p-1.5 hover:bg-[#FF3B30]/10 rounded-lg transition-colors text-[#FF3B30]"
                                title="Delete customer"
                              >
                                <span className="text-base leading-none">×</span>
                              </button>
                            </div>
                          ))}
                          {(businessData?.customers || []).length === 0 && (
                            <p className="text-sm text-[#86868b] text-center py-4">No customers yet</p>
                          )}
                        </div>
                      </div>

                      {/* Operating Hours */}
                      <div className="bg-white border border-[#e8e8ed] rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-[#1d1d1f] mb-4">Operating Hours</h3>
                        <div className="space-y-2">
                          {Object.entries(businessData?.operating_hours || {}).map(([day, hours]: [string, { open: string; close: string }]) => (
                            <div key={day} className="flex items-center justify-between py-2 border-b border-[#e8e8ed] last:border-b-0">
                              <span className="text-[#1d1d1f] font-medium capitalize">{day}</span>
                              <span className="text-sm text-[#86868b]">
                                {hours.closed ? 'Closed' : `${hours.open || 'N/A'} - ${hours.close || 'N/A'}`}
                              </span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-[#86868b] mt-4">Operating hours can be updated via API</p>
                      </div>
                    </div>

                  </>
                )}
              </div>
            ) : activeView === 'bills' ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF3B30] to-[#FF6B6B] flex items-center justify-center">
                    <span className="text-2xl">💳</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-[#1d1d1f]">Bills</h2>
                    <p className="text-sm text-[#86868b]">Track and manage your bills and payments</p>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-[#e8e8ed] rounded-xl p-4">
                    <p className="text-sm text-[#86868b] mb-1">Total Due</p>
                    <p className="text-2xl font-semibold text-[#1d1d1f]">
                      ${bills.filter(b => !b.paid).reduce((sum, b) => sum + (b.amount || 0), 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-white border border-[#e8e8ed] rounded-xl p-4">
                    <p className="text-sm text-[#86868b] mb-1">Unpaid Bills</p>
                    <p className="text-2xl font-semibold text-[#1d1d1f]">{bills.filter(b => !b.paid).length}</p>
                  </div>
                  <div className="bg-white border border-[#e8e8ed] rounded-xl p-4">
                    <p className="text-sm text-[#86868b] mb-1">Paid This Month</p>
                    <p className="text-2xl font-semibold text-[#1d1d1f]">
                      ${bills.filter(b => b.paid && b.paid_at && new Date(b.paid_at).getMonth() === new Date().getMonth()).reduce((sum, b) => sum + (b.amount || 0), 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Add New Bill */}
                <div className="bg-white border border-[#e8e8ed] rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-[#1d1d1f] mb-4">Add New Bill</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-[#1d1d1f] mb-1">Bill Name</label>
                      <input
                        type="text"
                        value={newBillName}
                        onChange={(e) => setNewBillName(e.target.value)}
                        placeholder="e.g., Electric Bill, Rent"
                        className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#FF3B30]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-[#1d1d1f] mb-1">Amount ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newBillAmount}
                          onChange={(e) => setNewBillAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#FF3B30]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#1d1d1f] mb-1">Due Date</label>
                        <input
                          type="date"
                          value={newBillDueDate}
                          onChange={(e) => setNewBillDueDate(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#FF3B30]"
                        />
                      </div>
                    </div>
                    <button
                      onClick={addBill}
                      disabled={!newBillName.trim() || !newBillAmount.trim()}
                      className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF3B30] to-[#FF6B6B] text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Bill
                    </button>
                  </div>
                </div>

                {/* Bills List */}
                {loadingBills ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 text-[#FF3B30] animate-spin mx-auto mb-4" />
                    <p className="text-[#86868b]">Loading bills...</p>
                  </div>
                ) : bills.length === 0 ? (
                  <div className="bg-white border border-[#e8e8ed] rounded-xl p-12 text-center">
                    <span className="text-4xl mb-4 block">💳</span>
                    <p className="text-[#86868b] text-lg">No bills yet. Add one above to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Unpaid Bills */}
                    {bills.filter(b => !b.paid).length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-[#1d1d1f] mb-3">Unpaid Bills</h3>
                        <div className="space-y-2">
                          {bills.filter(b => !b.paid).map((bill) => {
                            const isOverdue = bill.due_date && new Date(bill.due_date) < new Date()
                            return (
                              <div
                                key={bill.id}
                                className={`bg-white border rounded-xl p-4 flex items-center justify-between ${
                                  isOverdue ? 'border-red-300 bg-red-50' : 'border-[#e8e8ed]'
                                }`}
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-lg font-semibold text-[#1d1d1f]">${(bill.amount || 0).toFixed(2)}</p>
                                    {isOverdue && (
                                      <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">Overdue</span>
                                    )}
                                  </div>
                                  <p className="text-[#1d1d1f] font-medium">{bill.name}</p>
                                  {bill.due_date && (
                                    <p className={`text-xs mt-1 ${isOverdue ? 'text-red-600' : 'text-[#86868b]'}`}>
                                      Due: {new Date(bill.due_date).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                                <button
                                  onClick={() => markBillPaid(bill.id)}
                                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#34C759] to-[#30D158] text-white font-semibold hover:opacity-90 transition-all"
                                >
                                  Mark Paid
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Paid Bills */}
                    {bills.filter(b => b.paid).length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-[#1d1d1f] mb-3">Paid Bills</h3>
                        <div className="space-y-2">
                          {bills.filter(b => b.paid).map((bill) => (
                            <div
                              key={bill.id}
                              className="bg-white border border-[#e8e8ed] rounded-xl p-4 flex items-center justify-between opacity-60"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-lg font-semibold text-[#1d1d1f] line-through">${(bill.amount || 0).toFixed(2)}</p>
                                  <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">Paid</span>
                                </div>
                                <p className="text-[#1d1d1f] line-through">{bill.name}</p>
                                {bill.paid_at && (
                                  <p className="text-xs text-[#86868b] mt-1">
                                    Paid: {new Date(bill.paid_at).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : activeView === 'budget' ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-[#1d1d1f]">Budget</h2>
                    <p className="text-sm text-[#86868b]">Manage your income, expenses, and budget</p>
                  </div>
                </div>

                {/* Budget Summary */}
                {budget && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border border-[#e8e8ed] rounded-xl p-4">
                      <p className="text-sm text-[#86868b] mb-1">Monthly Income</p>
                      <p className="text-2xl font-semibold text-[#1d1d1f]">${(budget.income || 0).toFixed(2)}</p>
                    </div>
                    <div className="bg-white border border-[#e8e8ed] rounded-xl p-4">
                      <p className="text-sm text-[#86868b] mb-1">Total Expenses</p>
                      <p className="text-2xl font-semibold text-[#1d1d1f]">
                        ${(budget.expenses || []).reduce((sum: number, e: Expense) => sum + (e.amount || 0), 0).toFixed(2)}
                      </p>
                    </div>
                    <div className={`bg-white border rounded-xl p-4 ${
                      (budget.income || 0) - (budget.expenses || []).reduce((sum: number, e: any) => sum + (e.amount || 0), 0) >= 0
                        ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                    }`}>
                      <p className="text-sm text-[#86868b] mb-1">Remaining</p>
                      <p className={`text-2xl font-semibold ${
                        (budget.income || 0) - (budget.expenses || []).reduce((sum: number, e: any) => sum + (e.amount || 0), 0) >= 0
                          ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${((budget.income || 0) - (budget.expenses || []).reduce((sum: number, e: any) => sum + (e.amount || 0), 0)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Set Income */}
                <div className="bg-white border border-[#e8e8ed] rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-[#1d1d1f] mb-4">Set Monthly Income</h3>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      step="0.01"
                      value={budgetIncome}
                      onChange={(e) => setBudgetIncome(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                    />
                    <button
                      onClick={setIncome}
                      disabled={!budgetIncome.trim()}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Set Income
                    </button>
                  </div>
                </div>

                {/* Add Expense */}
                <div className="bg-white border border-[#e8e8ed] rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-[#1d1d1f] mb-4">Add Expense</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-[#1d1d1f] mb-1">Amount ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newBudgetExpenseAmount}
                          onChange={(e) => setNewBudgetExpenseAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#1d1d1f] mb-1">Category</label>
                        <input
                          type="text"
                          value={newBudgetExpenseCategory}
                          onChange={(e) => setNewBudgetExpenseCategory(e.target.value)}
                          placeholder="e.g., Food, Transport"
                          className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1d1d1f] mb-1">Description (optional)</label>
                      <input
                        type="text"
                        value={newBudgetExpenseDescription}
                        onChange={(e) => setNewBudgetExpenseDescription(e.target.value)}
                        placeholder="What was this expense for?"
                        className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                      />
                    </div>
                    <button
                      onClick={addBudgetExpense}
                      disabled={!newBudgetExpenseAmount.trim() || !newBudgetExpenseCategory.trim()}
                      className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Expense
                    </button>
                  </div>
                </div>

                {/* Category Breakdown */}
                {budget && Object.keys(budget.categories || {}).length > 0 && (
                  <div className="bg-white border border-[#e8e8ed] rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-[#1d1d1f] mb-4">Category Breakdown</h3>
                    <div className="space-y-2">
                      {Object.entries(budget.categories || {})
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .map(([category, total]) => (
                          <div key={category} className="flex items-center justify-between py-2 border-b border-[#e8e8ed] last:border-b-0">
                            <span className="text-[#1d1d1f] font-medium capitalize">{category}</span>
                            <span className="text-[#1d1d1f] font-semibold">${(total as number).toFixed(2)}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Recent Expenses */}
                {budget && (budget.expenses || []).length > 0 && (
                  <div className="bg-white border border-[#e8e8ed] rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-[#1d1d1f] mb-4">Recent Expenses</h3>
                    <div className="space-y-2">
                      {(budget.expenses || []).slice(0, 20).map((expense: Expense) => (
                        <div key={expense.id} className="flex items-center justify-between p-3 border border-[#e8e8ed] rounded-xl">
                          <div>
                            <p className="font-medium text-[#1d1d1f]">${(expense.amount || 0).toFixed(2)}</p>
                            <p className="text-sm text-[#86868b]">{expense.category} {expense.description ? `- ${expense.description}` : ''}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : activeView === 'meal_planning' ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF6B6B] to-[#FF8E8E] flex items-center justify-center">
                    <span className="text-2xl">🍽️</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-[#1d1d1f]">Meal Planning</h2>
                    <p className="text-sm text-[#86868b]">Plan your meals for the week or month</p>
                  </div>
                </div>

                {/* Add New Meal Plan */}
                <div className="bg-white border border-[#e8e8ed] rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-[#1d1d1f] mb-4">Create Meal Plan</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-[#1d1d1f] mb-1">Plan Name</label>
                        <input
                          type="text"
                          value={newMealPlanName}
                          onChange={(e) => setNewMealPlanName(e.target.value)}
                          placeholder="e.g., Week 1, January"
                          className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#1d1d1f] mb-1">Date</label>
                        <input
                          type="date"
                          value={newMealPlanDate}
                          onChange={(e) => setNewMealPlanDate(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1d1d1f] mb-1">Meals (one per line)</label>
                      <textarea
                        value={newMealPlanMeals}
                        onChange={(e) => setNewMealPlanMeals(e.target.value)}
                        placeholder="Breakfast: Oatmeal&#10;Lunch: Salad&#10;Dinner: Pasta"
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]"
                      />
                    </div>
                    <button
                      onClick={addMealPlan}
                      disabled={!newMealPlanName.trim() || !newMealPlanDate.trim()}
                      className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create Meal Plan
                    </button>
                  </div>
                </div>

                {/* Meal Plans List */}
                {loadingMealPlans ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 text-[#FF6B6B] animate-spin mx-auto mb-4" />
                    <p className="text-[#86868b]">Loading meal plans...</p>
                  </div>
                ) : mealPlans.length === 0 ? (
                  <div className="bg-white border border-[#e8e8ed] rounded-xl p-12 text-center">
                    <span className="text-4xl mb-4 block">🍽️</span>
                    <p className="text-[#86868b] text-lg">No meal plans yet. Create one above to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mealPlans.map((plan: MealPlan) => (
                      <div key={plan.id} className="bg-white border border-[#e8e8ed] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-[#1d1d1f]">{plan.name}</h3>
                            {plan.date && (
                              <p className="text-sm text-[#86868b] mt-1">
                                {new Date(plan.date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        {plan.meals && plan.meals.length > 0 && (
                          <div className="space-y-2">
                            {plan.meals.map((meal: string, idx: number) => (
                              <div key={idx} className="p-3 bg-[#f5f5f7] rounded-lg">
                                <p className="text-[#1d1d1f]">{meal}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeView === 'crm' ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-[#1d1d1f]">CRM</h2>
                    <p className="text-sm text-[#86868b]">Customer Relationship Management</p>
                  </div>
                </div>

                {/* CRM Tabs */}
                <div className="bg-white border border-[#e8e8ed] rounded-xl p-6">
                  <div className="flex gap-2 mb-6 border-b border-[#e8e8ed]">
                    <button
                      onClick={() => setCrmTab('contacts')}
                      className={`px-4 py-2 text-sm font-medium transition-all border-b-2 ${
                        crmTab === 'contacts'
                          ? 'text-[#007AFF] border-[#007AFF]'
                          : 'text-[#86868b] border-transparent hover:text-[#1d1d1f]'
                      }`}
                    >
                      Contacts ({crmContacts.length})
                    </button>
                    <button
                      onClick={() => setCrmTab('deals')}
                      className={`px-4 py-2 text-sm font-medium transition-all border-b-2 ${
                        crmTab === 'deals'
                          ? 'text-[#007AFF] border-[#007AFF]'
                          : 'text-[#86868b] border-transparent hover:text-[#1d1d1f]'
                      }`}
                    >
                      Deals ({crmDeals.length})
                    </button>
                    <button
                      onClick={() => setCrmTab('tasks')}
                      className={`px-4 py-2 text-sm font-medium transition-all border-b-2 ${
                        crmTab === 'tasks'
                          ? 'text-[#007AFF] border-[#007AFF]'
                          : 'text-[#86868b] border-transparent hover:text-[#1d1d1f]'
                      }`}
                    >
                      Tasks ({crmTasks.length})
                    </button>
                  </div>

                  {loadingCRM ? (
                    <div className="text-center py-12">
                      <Loader2 className="w-8 h-8 text-[#007AFF] animate-spin mx-auto mb-4" />
                      <p className="text-[#86868b]">Loading CRM data...</p>
                    </div>
                  ) : (
                    <>
                      {crmTab === 'contacts' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-[#1d1d1f]">Contacts</h3>
                            <button className="px-4 py-2 bg-[#007AFF] text-white rounded-lg text-sm hover:bg-[#0051D5] transition-all">
                              + Add Contact
                            </button>
                          </div>
                          {crmContacts.length === 0 ? (
                            <div className="text-center py-12">
                              <p className="text-[#86868b]">No contacts yet. Add one to get started!</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {crmContacts.map((contact: CRMContact) => (
                                <div key={contact.id} className="bg-[#f5f5f7] border border-[#e8e8ed] rounded-xl p-4">
                                  <h4 className="font-semibold text-[#1d1d1f] mb-1">{contact.name || 'Unnamed Contact'}</h4>
                                  {contact.email && <p className="text-sm text-[#86868b]">{contact.email}</p>}
                                  {contact.phone && <p className="text-sm text-[#86868b]">{contact.phone}</p>}
                                  {contact.company && <p className="text-sm text-[#86868b] mt-1">{contact.company}</p>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {crmTab === 'deals' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-[#1d1d1f]">Deals</h3>
                            <button className="px-4 py-2 bg-[#007AFF] text-white rounded-lg text-sm hover:bg-[#0051D5] transition-all">
                              + Add Deal
                            </button>
                          </div>
                          {crmDeals.length === 0 ? (
                            <div className="text-center py-12">
                              <p className="text-[#86868b]">No deals yet. Add one to get started!</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {crmDeals.map((deal: CRMDeal) => (
                                <div key={deal.id} className="bg-[#f5f5f7] border border-[#e8e8ed] rounded-xl p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold text-[#1d1d1f]">{deal.name || 'Unnamed Deal'}</h4>
                                    {deal.value && (
                                      <span className="text-lg font-semibold text-[#007AFF]">${deal.value.toLocaleString()}</span>
                                    )}
                                  </div>
                                  {deal.stage && (
                                    <span className="inline-block px-2 py-1 text-xs bg-[#007AFF]/10 text-[#007AFF] rounded">
                                      {deal.stage}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {crmTab === 'tasks' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-[#1d1d1f]">Tasks</h3>
                            <button className="px-4 py-2 bg-[#007AFF] text-white rounded-lg text-sm hover:bg-[#0051D5] transition-all">
                              + Add Task
                            </button>
                          </div>
                          {crmTasks.length === 0 ? (
                            <div className="text-center py-12">
                              <p className="text-[#86868b]">No tasks yet. Add one to get started!</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {crmTasks.map((task: CRMTask) => (
                                <div key={task.id} className="bg-[#f5f5f7] border border-[#e8e8ed] rounded-xl p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-[#1d1d1f] mb-1">{task.title || 'Unnamed Task'}</h4>
                                      {task.description && <p className="text-sm text-[#86868b]">{task.description}</p>}
                                    </div>
                                    {task.status && (
                                      <span className={`px-2 py-1 text-xs rounded ${
                                        task.status === 'completed' ? 'bg-green-100 text-green-700' :
                                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                        'bg-gray-100 text-gray-700'
                                      }`}>
                                        {task.status}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : activeView === 'songs' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-[#1d1d1f]">Songs</h2>
                </div>

                {songHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-6">
                    <div className="text-6xl mb-4">🎵</div>
                    <h3 className="text-xl font-semibold text-[#1d1d1f]">No songs yet</h3>
                    <p className="text-[#86868b] text-center max-w-md">
                      Upload a song for AI to review, or generate a new song from scratch.
                    </p>
                    <div className="flex gap-4 mt-6">
                      <button
                        onClick={() => songFileInputRef.current?.click()}
                        disabled={uploadingSong}
                        className="px-6 py-3 bg-[#007AFF] text-white rounded-lg font-medium hover:bg-[#0051D5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Upload className="w-5 h-5" />
                        {uploadingSong ? 'Uploading...' : 'UPLOAD A SONG'}
                      </button>
                      <button
                        onClick={() => {
                          const prompt = window.prompt('Enter song title or description:')
                          if (prompt) {
                            const forFansOf = window.prompt('For fans of (artists/bands for inspiration, optional):')
                            // Pass values directly to avoid React state update timing issues
                            handleGenerateSong(prompt, forFansOf || '')
                          }
                        }}
                        disabled={generatingSong}
                        className="px-6 py-3 bg-[#FF9500] text-white rounded-lg font-medium hover:bg-[#E6850E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Wand2 className="w-5 h-5" />
                        {generatingSong ? 'Generating...' : 'GENERATE A SONG'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {songHistory.map((song) => {
                      const songDetail = songDetails[song.song_id]
                      const hasAudio = songDetail?.audio_file || song.audio_file
                      const isPlaying = currentlyPlaying === song.song_id
                      
                      return (
                      <div
                        key={song.song_id}
                        className="bg-white border border-[#e8e8ed] rounded-xl p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                {hasAudio && (
                                  <button
                                    onClick={() => {
                                      if (!songDetail) {
                                        loadSongDetails(song.song_id)
                                      } else {
                                        togglePlayPause(song.song_id)
                                      }
                                    }}
                                    className="flex-shrink-0 w-10 h-10 rounded-full bg-[#FF9500] hover:bg-[#E6850E] text-white flex items-center justify-center transition-all hover:scale-105"
                                    title={isPlaying ? 'Pause' : 'Play'}
                                  >
                                    {isPlaying ? (
                                      <Pause className="w-5 h-5" />
                                    ) : (
                                      <Play className="w-5 h-5 ml-0.5" />
                                    )}
                                  </button>
                                )}
                                <h3 className="text-lg font-semibold text-[#1d1d1f]">
                              {song.prompt || (song as any).filename || 'Untitled Song'}
                            </h3>
                              </div>
                            <div className="flex flex-wrap gap-2 text-sm text-[#86868b]">
                              {song.for_fans_of && (
                                <span className="px-2 py-1 bg-[#f5f5f7] rounded">For Fans Of: {song.for_fans_of}</span>
                              )}
                              {song.genre && (
                                <span className="px-2 py-1 bg-[#f5f5f7] rounded">Genre: {song.genre}</span>
                              )}
                              {song.mood && (
                                <span className="px-2 py-1 bg-[#f5f5f7] rounded">Mood: {song.mood}</span>
                              )}
                              {(song as any).type === 'uploaded' && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Uploaded</span>
                              )}
                              {(song as any).type === 'rewrite' && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">Rewrite</span>
                              )}
                              {(song as any).type === 'cover' && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Cover</span>
                              )}
                              {(song as any).type === 'alternative' && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">Alternative</span>
                              )}
                            </div>
                            <p className="text-xs text-[#86868b] mt-2">
                              {new Date(song.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => deleteSong(song.song_id)}
                            className="ml-4 text-[#86868b] hover:text-red-500 transition-colors"
                          >
                            🗑️
                          </button>
                        </div>
                          
                          {/* Music Player */}
                          {hasAudio && songDetail && (
                            <div className="mt-4 pt-4 border-t border-[#e8e8ed]">
                              <audio
                                ref={(el) => {
                                  if (el) {
                                    audioRefs.current[song.song_id] = el
                                  }
                                }}
                                src={songDetail.audio_file ? `${API_BASE_URL}${songDetail.audio_file}` : `${API_BASE_URL}/api/songs/${song.song_id}/audio`}
                                onPlay={() => {
                                  // Stop other songs
                                  Object.keys(audioRefs.current).forEach(id => {
                                    if (id !== song.song_id && audioRefs.current[id]) {
                                      audioRefs.current[id]?.pause()
                                      audioRefs.current[id]!.currentTime = 0
                                    }
                                  })
                                  setCurrentlyPlaying(song.song_id)
                                }}
                                onPause={() => {
                                  if (currentlyPlaying === song.song_id) {
                                    setCurrentlyPlaying(null)
                                  }
                                }}
                                onEnded={() => {
                                  setCurrentlyPlaying(null)
                                }}
                                className="w-full"
                                controls
                              />
                            </div>
                          )}
                          
                          {/* Show loading state if audio is being loaded */}
                          {hasAudio && !songDetail && (
                            <div className="mt-4 pt-4 border-t border-[#e8e8ed] flex items-center gap-2 text-sm text-[#86868b]">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Loading audio...</span>
                            </div>
                          )}
                          
                          {/* Show regenerate audio button if no audio */}
                          {!hasAudio && songDetail && songDetail.lyrics && (
                            <div className="mt-4 pt-4 border-t border-[#e8e8ed]">
                              <button
                                onClick={() => regenerateSongAudio(song.song_id)}
                                className="w-full px-4 py-2 bg-gradient-to-r from-[#FF9500] to-[#FF6B00] text-white rounded-lg font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
                              >
                                <Loader2 className="w-4 h-4" />
                                Generate Audio
                              </button>
                              <p className="text-xs text-[#86868b] mt-2 text-center">
                                This song has lyrics but no audio. Click to generate audio.
                              </p>
                            </div>
                          )}
                          
                        {(song as any).type === 'uploaded' && (
                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={() => handleAnalyzeSong(song.song_id)}
                              className="px-4 py-2 bg-[#007AFF] text-white rounded-lg text-sm hover:bg-[#0051D5] transition-colors"
                            >
                              Analyze
                            </button>
                            <button
                              onClick={() => handleRewriteSong(song.song_id)}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
                            >
                              Rewrite
                            </button>
                            <button
                              onClick={() => handleCreateCover(song.song_id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                            >
                              Cover
                            </button>
                            <button
                              onClick={() => handleCreateAlternative(song.song_id)}
                              className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 transition-colors"
                            >
                              Alternative
                            </button>
                          </div>
                        )}
                      </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : activeView === 'images' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-[#1d1d1f]">Images</h2>
                    <p className="text-sm text-[#86868b]">Upload, edit, and organize your photos</p>
                  </div>
                  <button
                    onClick={async () => {
                      if (!authToken) return
                      setLoadingGallery(true)
                      try {
                        const response = await axios.post(`${API_BASE_URL}/api/gallery/scan`, {}, {
                          headers: { Authorization: `Bearer ${authToken}` }
                        })
                        setGalleryDuplicates(response.data.duplicates || [])
                      } catch (error) {
                        alert('Failed to scan for duplicates')
                      } finally {
                        setLoadingGallery(false)
                      }
                    }}
                    disabled={loadingGallery}
                    className="px-4 py-2 bg-[#FF2D55] text-white rounded-lg text-sm hover:bg-[#E01E4F] transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {loadingGallery ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Scan for Duplicates
                  </button>
                </div>

                {/* Gallery Cleaner - Duplicates */}
                {galleryDuplicates.length > 0 && (
                  <div className="bg-white border border-[#e8e8ed] rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-[#1d1d1f] mb-4">Duplicate Photos Found</h3>
                    <p className="text-sm text-[#86868b] mb-4">
                      Found {galleryDuplicates.length} groups of similar photos. Review and delete duplicates.
                    </p>
                    <div className="space-y-4">
                      {galleryDuplicates.map((group: GalleryDuplicate, idx: number) => (
                        <div key={idx} className="border border-[#e8e8ed] rounded-xl p-4">
                          <p className="text-sm font-medium text-[#1d1d1f] mb-3">
                            Group {idx + 1} - {group.images.length} similar photos
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {group.images.map((photo, photoIdx: number) => (
                              <div key={photoIdx} className="relative group">
                                <img
                                  src={photo.url || photo.path}
                                  alt={`Duplicate ${photoIdx + 1}`}
                                  className="w-full aspect-square object-cover rounded-lg"
                                />
                                <button
                                  onClick={async () => {
                                    if (!authToken) return
                                    if (confirm('Delete this duplicate?')) {
                                      try {
                                        await axios.post(
                                          `${API_BASE_URL}/api/gallery/delete`,
                                          { file_path: photo.path },
                                          { headers: { Authorization: `Bearer ${authToken}` } }
                                        )
                                        setGalleryDuplicates(prev => prev.map((g: any, i: number) =>
                                          i === idx ? g.filter((p: any) => p.path !== photo.path) : g
                                        ).filter((g: any) => g.length > 0))
                                      } catch (error) {
                                        alert('Failed to delete photo')
                                      }
                                    }
                                  }}
                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-red-500 text-white rounded transition-all"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Image Upload/Generation */}
                <div className="bg-white border border-[#e8e8ed] rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-[#1d1d1f] mb-4">Upload or Generate Image</h3>
                  <div className="flex gap-4">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 px-6 py-3 bg-[#007AFF] text-white rounded-lg font-medium hover:bg-[#0051D5] transition-all flex items-center justify-center gap-2"
                    >
                      <Upload className="w-5 h-5" />
                      Upload Image
                    </button>
                    <button
                      onClick={async () => {
                        const prompt = window.prompt('Enter image description:')
                        if (prompt) {
                          await handleGenerateImageFromChat(prompt)
                        }
                      }}
                      className="flex-1 px-6 py-3 bg-[#FF2D55] text-white rounded-lg font-medium hover:bg-[#E01E4F] transition-all flex items-center justify-center gap-2"
                    >
                      <Wand2 className="w-5 h-5" />
                      Generate Image
                    </button>
                  </div>
                </div>

                {/* Image History */}
                {imageHistory.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {imageHistory.map((img) => (
                      <div key={img.file_id} className="relative group">
                        <img
                          src={`${API_BASE_URL}${img.url}`}
                          alt={img.filename}
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                        <button
                          onClick={() => {
                            if (confirm('Delete this image?')) {
                              deleteImage(img.file_id)
                            }
                          }}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-red-500 text-white rounded transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeView === 'videos' ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-[#1d1d1f] mb-4">Videos</h2>
                <p className="text-[#86868b]">Your videos will appear here.</p>
              </div>
            ) : activeView === 'bsv_inscribe' ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#EAB300] to-[#FFD700] flex items-center justify-center">
                    <span className="text-2xl">📝</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-[#1d1d1f]">BSV Inscription</h2>
                    <p className="text-sm text-[#86868b]">Write data to BSV as 1satordinals</p>
                  </div>
                </div>

                <div className="bg-white border border-[#e8e8ed] rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-[#1d1d1f] mb-4">Inscribe Data to BSV</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#1d1d1f] mb-2">Data Type</label>
                      <select className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#EAB300]">
                        <option value="text">Text/Data</option>
                        <option value="screenshot">Screenshot URL</option>
                        <option value="file">File Upload</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1d1d1f] mb-2">Content</label>
                      <textarea
                        placeholder="Enter text data, URL, or upload a file to inscribe to BSV..."
                        rows={6}
                        className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#EAB300]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1d1d1f] mb-2">Description (optional)</label>
                      <input
                        type="text"
                        placeholder="e.g., Family documents, website backup, important data..."
                        className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#EAB300]"
                      />
                    </div>
                    <button
                      onClick={async () => {
                        if (!authToken) return
                        const data = (document.querySelector('textarea') as HTMLTextAreaElement)?.value
                        const description = (document.querySelector('input[type="text"]') as HTMLInputElement)?.value
                        if (!data?.trim()) {
                          alert('Please enter data to inscribe')
                          return
                        }
                        try {
                          const response = await axios.post(
                            `${API_BASE_URL}/api/bsv/inscribe`,
                            { data, description },
                            { headers: { Authorization: `Bearer ${authToken}` } }
                          )
                          alert(`Successfully inscribed to BSV! Transaction: ${response.data.txid || 'Pending'}`)
                        } catch (error: unknown) {
                          alert(`Failed to inscribe: ${error.response?.data?.detail || error.message}`)
                        }
                      }}
                      className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-[#EAB300] to-[#FFD700] text-white font-semibold hover:opacity-90 transition-all"
                    >
                      Inscribe to BSV
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> BSV inscriptions create permanent 1satordinals on the Bitcoin SV blockchain. 
                    This is useful for backing up important data, documents, or creating permanent records.
                  </p>
                </div>
              </div>
            ) : activeView.startsWith('skill_') ? (() => {
              const skillId = activeView.replace('skill_', '')
              const skill = skills.find(s => s.id === skillId) || currentSkillView
              if (!skill) return null
              
              return (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center">
                      <span className="text-2xl">{skill.icon}</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-[#1d1d1f]">{skill.name}</h2>
                      <p className="text-sm text-[#86868b]">{skill.description}</p>
                    </div>
                  </div>

                  <div className="bg-white border border-[#e8e8ed] rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-[#1d1d1f] mb-4">Use {skill.name}</h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={skillTask}
                        onChange={(e) => setSkillTask(e.target.value)}
                        placeholder="What would you like to do with this skill?"
                        className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] transition-all text-[15px] placeholder:text-[#86868b]"
                        onKeyPress={(e) => e.key === 'Enter' && skillTask.trim() && handleExecuteSkill(skill, skillTask)}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (skillTask.trim()) {
                              handleExecuteSkill(skill, skillTask)
                              setSkillTask('')
                            }
                          }}
                          disabled={!skillTask.trim() || executingSkill}
                          className="flex-1 px-5 py-3 rounded-xl bg-[#007AFF] text-white font-medium hover:bg-[#0051D5] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {executingSkill ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Executing...
                            </>
                          ) : (
                            'Execute'
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setActiveView('skills')
                            setCurrentSkillView(null)
                            setSkillTask('')
                          }}
                          className="px-5 py-3 rounded-xl bg-[#f5f5f7] border border-[#e8e8ed] hover:bg-[#e8e8ed] transition-all font-medium"
                        >
                          Back
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })() : null}

            {activeView === 'chat' && <div ref={messagesEndRef} />}
          </div>
        </div>

        {/* Media Preview & Edit */}
        {selectedFile && (
          <div className="border-t border-[#e8e8ed] glass px-8 py-5 animate-slide-up">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  {selectedFile.type === 'image' ? (
                    <img
                      src={selectedFile.url}
                      alt={selectedFile.filename}
                      className="w-32 h-32 rounded-2xl object-cover shadow-lg border border-[#e8e8ed]"
                    />
                  ) : (
                    <video
                      src={selectedFile.url}
                      controls
                      className="w-32 h-32 rounded-2xl object-cover shadow-lg border border-[#e8e8ed]"
                    />
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#1d1d1f]">{selectedFile.filename}</p>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="w-8 h-8 rounded-full bg-white border border-[#e8e8ed] flex items-center justify-center hover:bg-[#f5f5f7] active:scale-95 transition-all"
                    >
                      <X className="w-4 h-4 text-[#86868b]" />
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={editInstruction}
                      onChange={(e) => setEditInstruction(e.target.value)}
                      placeholder="e.g., brighten, darken, grayscale, blur..."
                      className="input-apple flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && handleEdit()}
                    />
                    <button
                      onClick={handleEdit}
                      disabled={!editInstruction.trim() || editing}
                      className="btn-apple disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {editing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Edit'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Input Area - Only show for chat view */}
        {activeView === 'chat' && (
        <div className="border-t border-[#e8e8ed] glass px-8 py-5">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  // Close expanded menus when user starts typing
                  if (e.target.value.length > 0) {
                    closeAllExpandedMenus()
                  }
                }}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={selectedFile ? "Type your message or edit command..." : "Type your message..."}
                className="input-apple flex-1 text-[15px]"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="btn-apple disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[60px] justify-center"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
        )}

        {/* Recent Documents Context Menu */}
        {showRecentDocuments && contextMenuPosition && (
          <div
            className="fixed bg-white border border-[#e8e8ed] rounded-xl shadow-2xl z-50 max-w-md max-h-96 overflow-y-auto"
            style={{
              left: `${contextMenuPosition.x}px`,
              top: `${contextMenuPosition.y}px`,
              transform: 'translate(-50%, 10px)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[#e8e8ed] flex items-center justify-between">
              <h3 className="font-semibold text-[#1d1d1f]">Recent Documents</h3>
              <button
                onClick={() => {
                  setShowRecentDocuments(false)
                  setContextMenuPosition(null)
                }}
                className="p-1 hover:bg-[#f5f5f7] rounded transition-colors"
              >
                <X className="w-4 h-4 text-[#86868b]" />
              </button>
      </div>
            <div className="p-2">
              {recentDocuments.length === 0 ? (
                <p className="text-sm text-[#86868b] px-4 py-8 text-center">No recent documents</p>
              ) : (
                <div className="space-y-1">
                  {recentDocuments.map((doc, index) => (
                    <button
                      key={doc.document_id || index}
                      onClick={async () => {
                        if (!authToken) return
                        try {
                          // Open the document folder
                          await axios.post(
                            `${API_BASE_URL}/api/files/open-folder`,
                            { skill_id: doc.skill_id || recentDocumentsSkillId },
                            { headers: { Authorization: `Bearer ${authToken}` } }
                          )
                          // Show document info in chat
                          const message: Message = {
                            id: Date.now().toString(),
                            role: 'assistant',
                            content: `📄 **Opened Document**\n\nDocument ID: ${doc.document_id}\nCreated: ${doc.created_at ? new Date(doc.created_at).toLocaleString() : 'Unknown'}\n\nThe folder containing this document has been opened.`,
                            timestamp: new Date(),
                          }
                          setMessages((prev) => [...prev, message])
                          setActiveView('chat')
                        } catch (error: unknown) {
                          alert(`Failed to open document folder: ${error.response?.data?.detail || error.message}`)
                        }
                        setShowRecentDocuments(false)
                        setContextMenuPosition(null)
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg hover:bg-[#f5f5f7] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1d1d1f] truncate">
                            {doc.document_id || `Document ${index + 1}`}
                          </p>
                          <p className="text-xs text-[#86868b] mt-0.5">
                            {doc.last_accessed ? new Date(doc.last_accessed).toLocaleString() : 'Unknown date'}
                          </p>
                        </div>
                        <span className="text-xs text-[#86868b] ml-2">{doc.activity_count || 0} activities</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Click outside to close context menu */}
        {showRecentDocuments && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setShowRecentDocuments(false)
              setContextMenuPosition(null)
            }}
          />
        )}
      </div>

      {/* Progress Logs Panel */}
      {showProgressLogs && (
        <div className="fixed bottom-4 right-4 w-96 bg-white border border-[#e8e8ed] rounded-xl shadow-2xl z-50 max-h-[600px] flex flex-col">
          <div className="p-4 border-b border-[#e8e8ed] flex items-center justify-between">
            <h3 className="font-semibold text-[#1d1d1f]">Progress Logs</h3>
            <button
              onClick={() => setShowProgressLogs(false)}
              className="p-1 rounded-lg hover:bg-[#f5f5f7] transition-all"
            >
              <X className="w-4 h-4 text-[#86868b]" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {progressLogs.length === 0 ? (
              <div className="text-center text-[#86868b] text-sm py-8">No progress logs</div>
            ) : (
              progressLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-[#f5f5f7] rounded-lg p-3 border border-[#e8e8ed]"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {log.type === 'image' && <ImageIcon className="w-4 h-4 text-[#FF2D55]" />}
                        {log.type === 'video' && <Video className="w-4 h-4 text-[#5856D6]" />}
                        {log.type === 'song' && <Music className="w-4 h-4 text-[#FF9500]" />}
                        {log.type === 'chat' && <History className="w-4 h-4 text-[#007AFF]" />}
                        {log.type === 'other' && <Loader2 className="w-4 h-4 text-[#86868b]" />}
                        <h4 className="text-sm font-medium text-[#1d1d1f]">{log.title}</h4>
                      </div>
                      <p className="text-xs text-[#86868b] mb-2">{log.message}</p>
                      {log.details && (
                        <p className="text-xs text-[#86868b] mb-2">{log.details}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeProgressLog(log.id)}
                      className="p-1 rounded hover:bg-[#e8e8ed] transition-all ml-2"
                      title="Remove log"
                    >
                      <X className="w-3 h-3 text-[#86868b]" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-medium ${
                        log.status === 'completed' ? 'text-green-600' :
                        log.status === 'error' ? 'text-red-600' :
                        log.status === 'in_progress' ? 'text-[#007AFF]' :
                        'text-[#86868b]'
                      }`}>
                        {log.status === 'completed' ? 'Completed' :
                         log.status === 'error' ? 'Error' :
                         log.status === 'in_progress' ? 'In Progress' :
                         'Pending'}
                      </span>
                      <span className="text-[#86868b]">{log.progress}%</span>
                    </div>
                    <div className="w-full bg-[#e8e8ed] rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          log.status === 'completed' ? 'bg-green-500' :
                          log.status === 'error' ? 'bg-red-500' :
                          log.status === 'in_progress' ? 'bg-[#007AFF]' :
                          'bg-[#86868b]'
                        }`}
                        style={{ width: `${log.progress}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-[#86868b] mt-2">
                    {log.timestamp.toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  )
}
