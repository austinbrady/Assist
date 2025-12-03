import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:4199'
const PERSONAL_AI_URL = 'http://localhost:4202'

export interface User {
  id: string
  username: string
  email?: string
  name?: string
  avatar?: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)

  // Load token and user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('assisant_ai_token')
    const storedUser = localStorage.getItem('assisant_ai_user')
    
    if (storedToken && storedUser) {
      setToken(storedToken)
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        console.error('Failed to parse stored user:', e)
      }
    }
    setLoading(false)
  }, [])

  const logout = useCallback(async () => {
    const currentToken = token
    if (currentToken) {
      try {
        await axios.post(`${PERSONAL_AI_URL}/api/auth/logout`, {}, {
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
    if (!token) return

    // For now, just verify we have a stored user
    // PersonalAI backend doesn't have a verify endpoint, so we rely on stored data
    // Token will be validated when making API calls
    const storedUser = localStorage.getItem('assisant_ai_user')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setUser(userData)
      } catch (e) {
        console.error('Failed to parse stored user:', e)
        // Clear invalid data
        setToken(null)
        setUser(null)
        localStorage.removeItem('assisant_ai_token')
        localStorage.removeItem('assisant_ai_user')
      }
    } else {
      // Clear token if no user data
      setToken(null)
      setUser(null)
      localStorage.removeItem('assisant_ai_token')
      localStorage.removeItem('assisant_ai_user')
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
    try {
      // Use PersonalAI backend directly (shared account system)
      const response = await axios.post(`${PERSONAL_AI_URL}/api/auth/login`, {
        username,
        password
      })

      const { token: newToken, username: responseUsername } = response.data
      const userData: User = {
        id: responseUsername,
        username: responseUsername,
        name: responseUsername
      }
      
      setToken(newToken)
      setUser(userData)
      localStorage.setItem('assisant_ai_token', newToken)
      localStorage.setItem('assisant_ai_user', JSON.stringify(userData))
      return { success: true }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.response?.data?.error || 'Login failed'
      return {
        success: false,
        error: errorMessage
      }
    }
  }, [])

  const signup = useCallback(async (username: string, password: string) => {
    try {
      // Auto-capitalize username: first letter uppercase, rest lowercase
      const capitalizedUsername = username.trim().charAt(0).toUpperCase() + username.trim().slice(1).toLowerCase()
      
      // Use PersonalAI backend directly (shared account system)
      const response = await axios.post(`${PERSONAL_AI_URL}/api/auth/signup`, {
        username: capitalizedUsername,
        password
      })

      const { token: newToken, username: responseUsername } = response.data
      const userData: User = {
        id: responseUsername,
        username: responseUsername,
        name: responseUsername
      }
      
      setToken(newToken)
      setUser(userData)
      localStorage.setItem('assisant_ai_token', newToken)
      localStorage.setItem('assisant_ai_user', JSON.stringify(userData))
      return { success: true }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.response?.data?.error || 'Signup failed'
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

