/**
 * Shared Agent Infrastructure Package
 * Provides agent communication utilities for all AssisantAI apps
 * 
 * Automatically integrates with the learner system for:
 * - Personalization based on user insights
 * - Learning from conversations to better understand users
 */

import { Learner } from '@assisant-ai/learner';

export interface AgentMessage {
  message: string;
  context?: Record<string, any>;
  appId?: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    appId?: string;
  }>;
}

export interface AgentResponse {
  response: string;
  context?: Record<string, any>;
  timestamp: string;
}

export interface ConversationHistory {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    appId?: string;
  }>;
}

export class AgentClient {
  private baseUrl: string;
  private token: string | null;
  private learner: Learner;
  private autoLearn: boolean;
  private autoPersonalize: boolean;

  constructor(
    baseUrl: string = process.env.MIDDLEWARE_URL || 'http://localhost:3000',
    token?: string,
    options?: {
      autoLearn?: boolean; // Automatically learn from conversations (default: true)
      autoPersonalize?: boolean; // Automatically use personalization (default: true)
    }
  ) {
    this.baseUrl = baseUrl;
    this.token = token || null;
    this.autoLearn = options?.autoLearn !== false; // Default to true
    this.autoPersonalize = options?.autoPersonalize !== false; // Default to true
    
    // Initialize learner with same base URL and token
    this.learner = new Learner(baseUrl, token);
  }

  /**
   * Set authentication token
   */
  setToken(token: string): void {
    this.token = token;
    this.learner.setToken(token);
  }

  /**
   * Send message to agent with full conversation history
   * This ensures the agent always has full context of the conversation
   * 
   * Automatically:
   * - Includes personalization context from learner (if enabled)
   * - Learns from the conversation after getting response (if enabled)
   */
  async sendMessage(
    message: string,
    context?: Record<string, any>,
    appId?: string,
    includeHistory: boolean = true
  ): Promise<AgentResponse> {
    if (!this.token) {
      throw new Error('Authentication token required');
    }

    // Get conversation history if requested (default behavior)
    let conversationHistory: ConversationHistory | null = null;
    if (includeHistory) {
      try {
        conversationHistory = await this.getHistory(100, 0, appId);
      } catch (error) {
        // If history fetch fails, continue without it (don't block the message)
        console.warn('Failed to fetch conversation history, sending message without it:', error);
      }
    }

    // Get personalization context from learner (if enabled)
    let personalizationContext = '';
    if (this.autoPersonalize) {
      try {
        personalizationContext = await this.learner.getPersonalizationContext();
      } catch (error) {
        // Fail silently - personalization is nice-to-have
        console.warn('Failed to get personalization context, continuing without it:', error);
      }
    }

    // Build request body with conversation history and personalization
    const requestBody: any = {
      message,
      context: {
        ...context,
        // Include personalization context if available
        ...(personalizationContext ? { personalization: personalizationContext } : {})
      },
      appId,
      // Include full conversation history so agent understands context
      conversationHistory: conversationHistory?.messages || []
    };

    const response = await fetch(`${this.baseUrl}/api/agent/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    const agentResponse = await response.json() as AgentResponse;

    // Automatically learn from this conversation (if enabled, non-blocking)
    if (this.autoLearn && agentResponse.response) {
      // Don't await - let learning happen in background
      this.learner.learnFromConversation(
        message,
        agentResponse.response,
        {
          appId,
          timestamp: agentResponse.timestamp || new Date().toISOString()
        }
      ).catch((error) => {
        // Fail silently - learning shouldn't break conversations
        console.warn('Learning from conversation failed (non-critical):', error);
      });
    }

    return agentResponse;
  }

  /**
   * Get conversation history
   */
  async getHistory(
    limit: number = 50,
    offset: number = 0,
    appId?: string
  ): Promise<ConversationHistory> {
    if (!this.token) {
      throw new Error('Authentication token required');
    }

    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    if (appId) params.append('appId', appId);

    const response = await fetch(
      `${this.baseUrl}/api/agent/history?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get history');
    }

    return response.json() as Promise<ConversationHistory>;
  }

  /**
   * Get agent state
   */
  async getState(): Promise<any> {
    if (!this.token) {
      throw new Error('Authentication token required');
    }

    const response = await fetch(`${this.baseUrl}/api/agent/state`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get agent state');
    }

    return response.json();
  }

  /**
   * Update agent preferences
   */
  async updatePreferences(preferences: Record<string, any>): Promise<void> {
    if (!this.token) {
      throw new Error('Authentication token required');
    }

    const response = await fetch(`${this.baseUrl}/api/agent/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(preferences)
    });

    if (!response.ok) {
      throw new Error('Failed to update preferences');
    }
  }

  /**
   * Get learner instance for direct access to learning features
   */
  getLearner(): Learner {
    return this.learner;
  }

  /**
   * Enable or disable automatic learning from conversations
   */
  setAutoLearn(enabled: boolean): void {
    this.autoLearn = enabled;
  }

  /**
   * Enable or disable automatic personalization
   */
  setAutoPersonalize(enabled: boolean): void {
    this.autoPersonalize = enabled;
  }
}

export default AgentClient;

