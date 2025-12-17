/**
 * API Client with local-first, cloud-fallback connection strategy
 */

export interface ApiConfig {
  localBackendUrl: string;
  cloudBackendUrl?: string;
  connectionPreference: 'local-first' | 'cloud-first' | 'local-only';
}

export interface ConnectionStatus {
  connected: boolean;
  backend: 'local' | 'cloud' | null;
  lastCheck: Date;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
  context?: Record<string, any>;
  pageContext?: PageContext;
}

export interface PageContext {
  pageType: string;
  primaryContent: string;
  url: string;
  pageTitle: string;
  images?: ImageMetadata[];
  video?: VideoMetadata | null;
  forms?: FormData[];
}

export interface ImageMetadata {
  src: string;
  alt?: string;
  description?: string;
}

export interface VideoMetadata {
  platform: string;
  title?: string;
  description?: string;
  currentTime?: number;
}

export interface FormData {
  fields: FormField[];
}

export interface FormField {
  id: string;
  type: string;
  name?: string;
  label?: string;
  placeholder?: string;
  value?: string;
  required?: boolean;
}

export interface ChatResponse {
  response: string;
  conversation_id?: string;
  context?: Record<string, any>;
}

class ApiClient {
  private config: ApiConfig;
  private connectionStatus: ConnectionStatus = {
    connected: false,
    backend: null,
    lastCheck: new Date(0),
  };
  private healthCheckInterval: number | null = null;
  private token: string | null = null;

  constructor(config: ApiConfig) {
    this.config = config;
    this.loadConfig();
    this.loadToken();
  }

  private async loadConfig(): Promise<void> {
    const result = await chrome.storage.sync.get(['apiConfig']);
    if (result.apiConfig) {
      this.config = { ...this.config, ...result.apiConfig };
    }
  }

  private async loadToken(): Promise<void> {
    const result = await chrome.storage.local.get(['auth_token', 'assisant_ai_token']);
    this.token = result.assisant_ai_token || result.auth_token || null;
  }

  async setToken(token: string | null): Promise<void> {
    this.token = token;
    await chrome.storage.local.set({ 
      assisant_ai_token: token,
      auth_token: token 
    });
  }

  async updateConfig(config: Partial<ApiConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    await chrome.storage.sync.set({ apiConfig: this.config });
    // Recheck connection with new config
    await this.checkConnection();
  }

  /**
   * Check backend health and determine which backend to use
   */
  async checkConnection(): Promise<ConnectionStatus> {
    const now = new Date();
    
    // If checked recently (within 5 seconds), return cached status
    if (now.getTime() - this.connectionStatus.lastCheck.getTime() < 5000) {
      return this.connectionStatus;
    }

    const { localBackendUrl, cloudBackendUrl, connectionPreference } = this.config;

    // Try local first if preference is local-first or local-only
    if (connectionPreference === 'local-first' || connectionPreference === 'local-only') {
      const localHealthy = await this.checkHealth(localBackendUrl);
      if (localHealthy) {
        this.connectionStatus = {
          connected: true,
          backend: 'local',
          lastCheck: now,
        };
        return this.connectionStatus;
      }
    }

    // Try cloud if preference is cloud-first, or if local failed and not local-only
    if (connectionPreference === 'cloud-first' || 
        (connectionPreference === 'local-first' && cloudBackendUrl)) {
      if (cloudBackendUrl) {
        const cloudHealthy = await this.checkHealth(cloudBackendUrl);
        if (cloudHealthy) {
          this.connectionStatus = {
            connected: true,
            backend: 'cloud',
            lastCheck: now,
          };
          return this.connectionStatus;
        }
      }
    }

    // If cloud-first preference and cloud failed, try local as fallback
    if (connectionPreference === 'cloud-first' && cloudBackendUrl) {
      const localHealthy = await this.checkHealth(localBackendUrl);
      if (localHealthy) {
        this.connectionStatus = {
          connected: true,
          backend: 'local',
          lastCheck: now,
        };
        return this.connectionStatus;
      }
    }

    // No backend available
    this.connectionStatus = {
      connected: false,
      backend: null,
      lastCheck: now,
    };
    return this.connectionStatus;
  }

  private async checkHealth(url: string): Promise<boolean> {
    try {
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000), // 3 second timeout
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the active backend URL
   */
  private getActiveBackendUrl(): string | null {
    if (!this.connectionStatus.connected) {
      return null;
    }

    if (this.connectionStatus.backend === 'local') {
      return this.config.localBackendUrl;
    } else if (this.connectionStatus.backend === 'cloud' && this.config.cloudBackendUrl) {
      return this.config.cloudBackendUrl;
    }

    return null;
  }

  /**
   * Send chat message with automatic backend selection and retry logic
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    // Ensure connection is checked
    await this.checkConnection();

    const backendUrl = this.getActiveBackendUrl();
    if (!backendUrl) {
      throw new Error('No backend available. Please check your connection settings.');
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Build request body
    const body: any = {
      message: request.message,
      conversation_id: request.conversation_id || 'extension-chat',
    };

    // Add context if provided
    if (request.context) {
      body.context = request.context;
    }

    // Add page context if provided
    if (request.pageContext) {
      body.page_context = request.pageContext;
      // Also add as device info for compatibility
      body.device_info = {
        deviceType: 'desktop',
        deviceName: 'Browser Extension',
        isMobile: false,
      };
    }

    // Retry logic with exponential backoff
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(`${backendUrl}/api/chat`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          // If unauthorized, try to refresh token or fail
          if (response.status === 401) {
            throw new Error('Authentication required. Please log in.');
          }

          // If backend unavailable, try to reconnect
          if (response.status >= 500) {
            await this.checkConnection();
            const newBackendUrl = this.getActiveBackendUrl();
            if (newBackendUrl && newBackendUrl !== backendUrl) {
              // Switch to other backend and retry
              continue;
            }
          }

          const errorText = await response.text().catch(() => '');
          throw new Error(`Backend error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        return {
          response: data.response || 'I received your message, but couldn\'t generate a response.',
          conversation_id: data.conversation_id || request.conversation_id,
          context: data.context,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // If this is the last attempt, throw
        if (attempt === 2) {
          break;
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw lastError || new Error('Failed to send message');
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks(intervalMs: number = 30000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = window.setInterval(() => {
      this.checkConnection();
    }, intervalMs);
  }

  /**
   * Stop periodic health checks
   */
  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Get active backend URL (public method for use by other modules)
   */
  getBackendUrl(): string | null {
    return this.getActiveBackendUrl();
  }
}

// Default configuration
const defaultConfig: ApiConfig = {
  localBackendUrl: 'http://localhost:4202',
  connectionPreference: 'local-first',
};

// Export singleton instance
export const apiClient = new ApiClient(defaultConfig);
