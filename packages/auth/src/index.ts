/**
 * Unified Authentication Package
 * Provides authentication utilities for all AssisantAI apps
 */

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresIn: string;
}

export class AuthClient {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.MIDDLEWARE_URL || 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return response.json() as Promise<AuthResponse>;
  }

  /**
   * Register user
   */
  async register(email: string, password: string, name?: string): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });

    if (!response.ok) {
      throw new Error('Registration failed');
    }

    return response.json() as Promise<AuthResponse>;
  }

  /**
   * Get current user from token
   */
  async getCurrentUser(token: string): Promise<User> {
    const response = await fetch(`${this.baseUrl}/api/auth/verify`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error('Invalid token');
    }

    const data = await response.json() as { user: User };
    return data.user;
  }

  /**
   * Store token in localStorage (for browser)
   */
  static storeToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('assisant_ai_token', token);
    }
  }

  /**
   * Get token from localStorage (for browser)
   */
  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('assisant_ai_token');
    }
    return null;
  }

  /**
   * Remove token from localStorage (for browser)
   */
  static clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('assisant_ai_token');
    }
  }
}

/**
 * Get unified token from all possible sources
 * Checks URL params first (for hub navigation), then localStorage
 * This ensures static login across all apps
 */
export function getUnifiedToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  // Check URL params first (for hub navigation)
  const urlParams = new URLSearchParams(window.location.search);
  const urlToken = urlParams.get('token');
  if (urlToken) {
    localStorage.setItem('assisant_ai_token', urlToken);
    // Clean up URL parameter
    window.history.replaceState({}, '', window.location.pathname);
    return urlToken;
  }

  // Check localStorage
  const storedToken = localStorage.getItem('assisant_ai_token');
  if (storedToken) return storedToken;

  return null;
}

export default AuthClient;

