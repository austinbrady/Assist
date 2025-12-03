/**
 * Organic Learning System
 * Learns about users naturally through conversation without being creepy
 */

export interface UserInsight {
  category: 'preference' | 'interest' | 'goal' | 'pattern' | 'context' | 'skill';
  key: string;
  value: any;
  confidence: number; // 0-1, how confident we are in this insight
  sources: string[]; // Conversation IDs or message references
  firstLearned: string; // ISO timestamp
  lastUpdated: string; // ISO timestamp
  frequency: number; // How often this comes up
}

export interface LearningContext {
  conversationId?: string;
  appId?: string;
  timestamp: string;
  message?: string;
  response?: string;
}

export class Learner {
  private baseUrl: string;
  private token: string | null;

  constructor(
    baseUrl: string = process.env.MIDDLEWARE_URL || 'http://localhost:3000',
    token?: string
  ) {
    this.baseUrl = baseUrl;
    this.token = token || null;
  }

  /**
   * Set authentication token
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * Extract insights from a conversation naturally
   * This is called automatically by the agent system
   */
  async learnFromConversation(
    message: string,
    response: string,
    context?: LearningContext
  ): Promise<void> {
    if (!this.token) {
      return; // Silently fail if not authenticated
    }

    try {
      await fetch(`${this.baseUrl}/api/learner/learn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          message,
          response,
          context: context || {
            timestamp: new Date().toISOString()
          }
        })
      });
    } catch (error) {
      // Fail silently - learning shouldn't break the conversation
      console.warn('Learning system error (non-critical):', error);
    }
  }

  /**
   * Get user insights (for personalization)
   */
  async getInsights(category?: string): Promise<UserInsight[]> {
    if (!this.token) {
      throw new Error('Authentication token required');
    }

    const params = category ? `?category=${category}` : '';
    const response = await fetch(`${this.baseUrl}/api/learner/insights${params}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get insights');
    }

    return response.json() as Promise<UserInsight[]>;
  }

  /**
   * Get personalized context for agent
   * Returns insights formatted for use in agent prompts
   */
  async getPersonalizationContext(): Promise<string> {
    try {
      const insights = await this.getInsights();
      
      if (insights.length === 0) {
        return ''; // No insights yet
      }

      // Group insights by category
      const grouped: Record<string, UserInsight[]> = {};
      insights.forEach(insight => {
        if (!grouped[insight.category]) {
          grouped[insight.category] = [];
        }
        grouped[insight.category].push(insight);
      });

      // Build natural context string
      const contextParts: string[] = [];

      // Preferences
      if (grouped.preference) {
        const prefs = grouped.preference
          .filter(i => i.confidence > 0.5)
          .map(i => `${i.key}: ${i.value}`)
          .join(', ');
        if (prefs) {
          contextParts.push(`User preferences: ${prefs}`);
        }
      }

      // Interests
      if (grouped.interest) {
        const interests = grouped.interest
          .filter(i => i.confidence > 0.5)
          .map(i => i.value)
          .join(', ');
        if (interests) {
          contextParts.push(`User interests: ${interests}`);
        }
      }

      // Goals
      if (grouped.goal) {
        const goals = grouped.goal
          .filter(i => i.confidence > 0.5)
          .map(i => i.value)
          .join(', ');
        if (goals) {
          contextParts.push(`User goals: ${goals}`);
        }
      }

      // Patterns (work style, communication style, etc.)
      if (grouped.pattern) {
        const patterns = grouped.pattern
          .filter(i => i.confidence > 0.6)
          .map(i => `${i.key}: ${i.value}`)
          .join(', ');
        if (patterns) {
          contextParts.push(`User patterns: ${patterns}`);
        }
      }

      return contextParts.join('. ') + '.';
    } catch (error) {
      // Fail silently - personalization is nice-to-have
      return '';
    }
  }

  /**
   * Get specific insight value
   */
  async getInsight(category: string, key: string): Promise<any | null> {
    const insights = await this.getInsights(category);
    const insight = insights.find(i => i.key === key);
    return insight && insight.confidence > 0.5 ? insight.value : null;
  }
}

export default Learner;

