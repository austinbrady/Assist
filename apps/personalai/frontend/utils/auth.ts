/**
 * Unified authentication token utility
 * Uses the unified token getter from @assisant-ai/auth package
 */

import { getUnifiedToken } from '@assisant-ai/auth'

export function getAuthToken(): string | null {
  // Use unified token getter from auth package
  return getUnifiedToken()
}

export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('assisant_ai_token', token)
    // Also remove old key if it exists
    localStorage.removeItem('auth_token')
  }
}

export function removeAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('assisant_ai_token')
    localStorage.removeItem('auth_token')
  }
}
