import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { getUnifiedToken } from '@assisant-ai/auth'

const API_URL = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:4199'
const MIDDLEWARE_URL = API_URL

export interface User {
  id: string
  username: string
  email?: string
  name?: string
  avatar?: string
}

/**
 * Parse FastAPI validation error array into user-friendly message
 * FastAPI returns errors as: [{loc: ['body', 'field'], msg: 'error message', type: 'error_type'}, ...]
 */
function parseFastAPIValidationError(detail: any): string {
  if (typeof detail === 'string') {
    return detail
  }
  
  if (Array.isArray(detail)) {
    const errors = detail.map((err: any) => {
      const field = Array.isArray(err.loc) ? err.loc[err.loc.length - 1] : 'field'
      const message = err.msg || 'validation error'
      return `${field}: ${message}`
    })
    return errors.join('. ')
  }
  
  if (detail && typeof detail === 'object') {
    // Try to extract message from object
    return detail.msg || detail.message || detail.error || JSON.stringify(detail)
  }
  
  return 'Validation error'
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)

  // Load token using unified token getter (checks URL params and localStorage)
  useEffect(() => {
    const unifiedToken = getUnifiedToken()
    
    if (unifiedToken) {
      setToken(unifiedToken)
      // Don't call verifyToken() here - let the second useEffect handle it
      // when token state actually updates (React state updates are async)
    } else {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    const currentToken = token
    if (currentToken) {
      try {
        await axios.post(`${MIDDLEWARE_URL}/api/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${currentToken}` }
        })
      } catch (error) {
        console.error('Logout error:', error)
      }
    }
    
    setToken(null)
    setUser(null)
    localStorage.removeItem('assisant_ai_token')
    localStorage.removeItem('assisant_ai_user')
  }, [token])

  const verifyToken = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      // Verify token and get user info from middleware
      const response = await axios.get(`${MIDDLEWARE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const userData: User = {
        id: response.data.username,
        username: response.data.username,
        name: response.data.username,
        avatar: response.data.assistant?.avatar
      }

      setUser(userData)
      localStorage.setItem('assisant_ai_user', JSON.stringify(userData))
      setLoading(false)
    } catch (error: any) {
      console.error('Token verification failed:', error)
      // Clear invalid token
      setToken(null)
      setUser(null)
      localStorage.removeItem('assisant_ai_token')
      localStorage.removeItem('assisant_ai_user')
      setLoading(false)
    }
  }, [token])

  // Verify token on mount
  useEffect(() => {
    if (token) {
      verifyToken()
      // Note: PersonalAI doesn't have a verify endpoint, so we just check stored data
      // Token will be validated when making API calls
    }
  }, [token, verifyToken])

  const login = useCallback(async (username: string, password: string) => {
    // Validate inputs before making request
    const trimmedUsername = username.trim()
    const trimmedPassword = password.trim()
    
    if (!trimmedUsername || trimmedUsername.length === 0) {
      return {
        success: false,
        error: 'Username is required'
      }
    }
    
    if (!trimmedPassword || trimmedPassword.length === 0) {
      return {
        success: false,
        error: 'Password is required'
      }
    }

    try {
      console.log('[Auth] Attempting login for user:', trimmedUsername)
      
      // Use middleware for unified authentication
      const response = await axios.post(
        `${MIDDLEWARE_URL}/api/auth/login`,
        {
          username: trimmedUsername,
          password: trimmedPassword
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          validateStatus: (status) => status < 500 // Don't throw on 4xx errors
        }
      )

      if (response.status === 200 || response.status === 201) {
        const { token: newToken, user: userResponse } = response.data
        const userData: User = {
          id: userResponse.username,
          username: userResponse.username,
          name: userResponse.username,
          avatar: userResponse.assistant?.avatar
        }
        
        setToken(newToken)
        setUser(userData)
        localStorage.setItem('assisant_ai_token', newToken)
        localStorage.setItem('assisant_ai_user', JSON.stringify(userData))
        
        console.log('[Auth] Login successful for user:', userResponse.username)
        
        // Hard refresh to switch from generic "Assist" to user's Personal Character
        // This ensures all variables, settings, and Character data are loaded fresh
        setTimeout(() => {
          window.location.reload()
        }, 100)
        
        return { success: true }
      } else {
        const errorMessage = response.data?.detail || response.data?.error || `Login failed with status ${response.status}`
        console.error('[Auth] Login failed:', response.status, errorMessage)
        return {
          success: false,
          error: errorMessage
        }
      }
    } catch (error: any) {
      // Log detailed error information
      console.error('[Auth] Login error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        }
      })
      
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.error || 
                          error.message || 
                          'Login failed. Please check your credentials and try again.'
      
      return {
        success: false,
        error: errorMessage
      }
    }
  }, [])

  const signup = useCallback(async (username: string, password: string) => {
    // Validate inputs before making request
    const trimmedUsername = username.trim()
    const trimmedPassword = password.trim()
    
    if (!trimmedUsername || trimmedUsername.length === 0) {
      return {
        success: false,
        error: 'Username is required'
      }
    }
    
    if (!trimmedPassword || trimmedPassword.length === 0) {
      return {
        success: false,
        error: 'Password is required'
      }
    }
    
    if (trimmedPassword.length < 6) {
      return {
        success: false,
        error: 'Password must be at least 6 characters'
      }
    }

    try {
      // Auto-capitalize username: first letter uppercase, rest lowercase
      const capitalizedUsername = trimmedUsername.charAt(0).toUpperCase() + trimmedUsername.slice(1).toLowerCase()
      
      console.log('[Auth] Attempting signup for user:', capitalizedUsername)
      
      // Use middleware for unified authentication
      const response = await axios.post(
        `${MIDDLEWARE_URL}/api/auth/register`,
        {
          username: capitalizedUsername,
          password: trimmedPassword
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          validateStatus: (status) => status < 500 // Don't throw on 4xx errors
        }
      )

      if (response.status === 200 || response.status === 201) {
        const { token: newToken, user: userResponse } = response.data
        const userData: User = {
          id: userResponse.username,
          username: userResponse.username,
          name: userResponse.username,
          avatar: userResponse.assistant?.avatar
        }
        
        setToken(newToken)
        setUser(userData)
        localStorage.setItem('assisant_ai_token', newToken)
        localStorage.setItem('assisant_ai_user', JSON.stringify(userData))
        
        console.log('[Auth] Signup successful for user:', userResponse.username)
        
        // Hard refresh to switch from generic "Assist" to user's Personal Character
        // This ensures all variables, settings, and Character data are loaded fresh
        // Character is created automatically during signup
        setTimeout(() => {
          window.location.reload()
        }, 100)
        
        return { success: true }
      } else {
        // Parse FastAPI validation errors if present
        const detail = response.data?.detail
        let errorMessage: string
        
        if (detail) {
          errorMessage = parseFastAPIValidationError(detail)
        } else {
          errorMessage = response.data?.error || `Signup failed with status ${response.status}`
        }
        
        console.error('[Auth] Signup failed:', response.status, errorMessage, response.data)
        return {
          success: false,
          error: errorMessage
        }
      }
    } catch (error: any) {
      // Log detailed error information
      console.error('[Auth] Signup error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        }
      })
      
      // Parse FastAPI validation errors if present
      const detail = error.response?.data?.detail
      let errorMessage: string
      
      if (detail) {
        errorMessage = parseFastAPIValidationError(detail)
      } else {
        errorMessage = error.response?.data?.error || 
                      error.message || 
                      'Signup failed. Please try again.'
      }
      
      return {
        success: false,
        error: errorMessage
      }
    }
  }, [])


  return {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
  }
}

