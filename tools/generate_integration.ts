/**
 * Integration Code Generator
 * Generates integration code snippets for apps based on analysis results
 */

import fs from 'fs';
import path from 'path';

interface AppAnalysis {
  name: string;
  type: string;
  framework: string;
  auth: {
    type?: string;
    endpoints?: string[];
  };
  apis: Array<{
    method: string;
    path: string;
    file: string;
  }>;
}

interface IntegrationTemplate {
  auth: string;
  agent: string;
  api: string;
}

export function generateIntegrationCode(analysis: AppAnalysis): IntegrationTemplate {
  const templates: Record<string, IntegrationTemplate> = {
    react: {
      auth: generateReactAuth(),
      agent: generateReactAgent(),
      api: generateReactAPI()
    },
    nextjs: {
      auth: generateNextAuth(),
      agent: generateNextAgent(),
      api: generateNextAPI()
    },
    nodejs: {
      auth: generateNodeAuth(),
      agent: generateNodeAgent(),
      api: generateNodeAPI()
    },
    python: {
      auth: generatePythonAuth(),
      agent: generatePythonAgent(),
      api: generatePythonAPI()
    }
  };

  const framework = analysis.framework.toLowerCase();
  return templates[framework] || templates.nodejs;
}

function generateReactAuth(): string {
  return `
// Auth integration for React
import { useState, useEffect, createContext, useContext } from 'react';
import { AuthClient, AuthClient as Auth } from '@assisant-ai/auth';

const AuthContext = createContext<{
  user: any | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}>({
  user: null,
  login: async () => {},
  logout: () => {},
  loading: true
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = new Auth();

  useEffect(() => {
    const token = Auth.getToken();
    if (token) {
      auth.getCurrentUser(token)
        .then(setUser)
        .catch(() => Auth.clearToken())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { token, user } = await auth.login(email, password);
    Auth.storeToken(token);
    setUser(user);
  };

  const logout = () => {
    Auth.clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
`;
}

function generateReactAgent(): string {
  return `
// Agent integration for React
import { useState } from 'react';
import { AgentClient } from '@assisant-ai/agent';
import { useAuth } from './auth';

export const useAgent = () => {
  const { user } = useAuth();
  const [agent] = useState(() => {
    const token = AuthClient.getToken();
    return new AgentClient(process.env.REACT_APP_MIDDLEWARE_URL || 'http://localhost:3000', token || undefined);
  });
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (message: string, context?: Record<string, any>) => {
    setLoading(true);
    try {
      const response = await agent.sendMessage(message, context, 'your-app-id');
      setMessages(prev => [...prev, { role: 'user', content: message }, response]);
      return response;
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const history = await agent.getHistory(50, 0, 'your-app-id');
      setMessages(history.messages);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  return { sendMessage, loadHistory, messages, loading };
};
`;
}

function generateReactAPI(): string {
  return `
// API integration for React
const MIDDLEWARE_URL = process.env.REACT_APP_MIDDLEWARE_URL || 'http://localhost:3000';

export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = AuthClient.getToken();
  
  const response = await fetch(\`\${MIDDLEWARE_URL}\${endpoint}\`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${token}\`,
      ...options.headers
    }
  });

  if (!response.ok) {
    throw new Error(\`API error: \${response.statusText}\`);
  }

  return response.json();
};
`;
}

function generateNextAuth(): string {
  return `
// Auth integration for Next.js
import { AuthClient } from '@assisant-ai/auth';
import { useRouter } from 'next/router';
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const auth = new AuthClient(process.env.NEXT_PUBLIC_MIDDLEWARE_URL);

  useEffect(() => {
    const initAuth = async () => {
      const token = AuthClient.getToken();
      if (token) {
        try {
          const user = await auth.getCurrentUser(token);
          setUser(user);
        } catch {
          AuthClient.clearToken();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const { token, user } = await auth.login(email, password);
    AuthClient.storeToken(token);
    setUser(user);
    router.push('/dashboard');
  };

  const logout = () => {
    AuthClient.clearToken();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
`;
}

function generateNextAgent(): string {
  return `
// Agent integration for Next.js
import { AgentClient } from '@assisant-ai/agent';
import { useAuth } from './auth';

export const useAgent = () => {
  const { user } = useAuth();
  const [agent] = useState(() => {
    const token = AuthClient.getToken();
    return new AgentClient(process.env.NEXT_PUBLIC_MIDDLEWARE_URL, token);
  });

  // ... (similar to React implementation)
};
`;
}

function generateNextAPI(): string {
  return `
// API integration for Next.js (Server-side)
import { AuthClient } from '@assisant-ai/auth';

export async function getServerSideProps(context: any) {
  const token = context.req.cookies.token || context.req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return { redirect: { destination: '/login', permanent: false } };
  }

  const auth = new AuthClient(process.env.MIDDLEWARE_URL);
  const user = await auth.getCurrentUser(token);

  return { props: { user } };
}
`;
}

function generateNodeAuth(): string {
  return `
// Auth integration for Node.js/Express
import { Request, Response, NextFunction } from 'express';
import { AuthClient } from '@assisant-ai/auth';

const auth = new AuthClient(process.env.MIDDLEWARE_URL);

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const user = await auth.getCurrentUser(token);
    (req as any).user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
`;
}

function generateNodeAgent(): string {
  return `
// Agent integration for Node.js
import { AgentClient } from '@assisant-ai/agent';

export const createAgentHandler = (req: any, res: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  const agent = new AgentClient(process.env.MIDDLEWARE_URL, token);

  return {
    sendMessage: async (message: string, context?: any) => {
      return agent.sendMessage(message, context, 'your-app-id');
    },
    getHistory: async (limit = 50, offset = 0) => {
      return agent.getHistory(limit, offset, 'your-app-id');
    }
  };
};
`;
}

function generateNodeAPI(): string {
  return `
// API integration for Node.js
import axios from 'axios';

const MIDDLEWARE_URL = process.env.MIDDLEWARE_URL || 'http://localhost:3000';

export const proxyToMiddleware = async (endpoint: string, token: string, data?: any) => {
  return axios({
    method: 'POST',
    url: \`\${MIDDLEWARE_URL}/api/apps/your-app-id/proxy\`,
    headers: {
      'Authorization': \`Bearer \${token}\`,
      'Content-Type': 'application/json'
    },
    data: {
      endpoint,
      method: 'POST',
      data
    }
  });
};
`;
}

function generatePythonAuth(): string {
  return `
# Auth integration for Python
import requests
import os

MIDDLEWARE_URL = os.getenv('MIDDLEWARE_URL', 'http://localhost:3000')

class AuthClient:
    def __init__(self):
        self.base_url = MIDDLEWARE_URL
        self.token = None
    
    def login(self, email: str, password: str):
        response = requests.post(
            f'{self.base_url}/api/auth/login',
            json={'email': email, 'password': password}
        )
        response.raise_for_status()
        data = response.json()
        self.token = data['token']
        return data
    
    def get_current_user(self):
        if not self.token:
            raise ValueError('Not authenticated')
        
        response = requests.get(
            f'{self.base_url}/api/auth/verify',
            headers={'Authorization': f'Bearer {self.token}'}
        )
        response.raise_for_status()
        return response.json()['user']
`;
}

function generatePythonAgent(): string {
  return `
# Agent integration for Python
import requests
import os

MIDDLEWARE_URL = os.getenv('MIDDLEWARE_URL', 'http://localhost:3000')

class AgentClient:
    def __init__(self, token: str):
        self.base_url = MIDDLEWARE_URL
        self.token = token
    
    def send_message(self, message: str, context: dict = None, app_id: str = 'your-app-id'):
        response = requests.post(
            f'{self.base_url}/api/agent/message',
            headers={'Authorization': f'Bearer {self.token}'},
            json={'message': message, 'context': context, 'appId': app_id}
        )
        response.raise_for_status()
        return response.json()
    
    def get_history(self, limit: int = 50, offset: int = 0, app_id: str = 'your-app-id'):
        response = requests.get(
            f'{self.base_url}/api/agent/history',
            headers={'Authorization': f'Bearer {self.token}'},
            params={'limit': limit, 'offset': offset, 'appId': app_id}
        )
        response.raise_for_status()
        return response.json()
`;
}

function generatePythonAPI(): string {
  return `
# API integration for Python
import requests
import os

MIDDLEWARE_URL = os.getenv('MIDDLEWARE_URL', 'http://localhost:3000')

def proxy_request(endpoint: str, token: str, data: dict = None):
    response = requests.post(
        f'{MIDDLEWARE_URL}/api/apps/your-app-id/proxy',
        headers={'Authorization': f'Bearer {token}'},
        json={'endpoint': endpoint, 'method': 'POST', 'data': data}
    )
    response.raise_for_status()
    return response.json()
`;
}

// CLI usage
if (require.main === module) {
  const analysisFile = process.argv[2];
  const outputDir = process.argv[3] || './integration-code';

  if (!analysisFile) {
    console.error('Usage: tsx generate_integration.ts <analysis_results.json> [output-dir]');
    process.exit(1);
  }

  const analysis = JSON.parse(fs.readFileSync(analysisFile, 'utf-8'));
  const code = generateIntegrationCode(analysis[0]); // Use first app

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'auth.ts'), code.auth);
  fs.writeFileSync(path.join(outputDir, 'agent.ts'), code.agent);
  fs.writeFileSync(path.join(outputDir, 'api.ts'), code.api);

  console.log(`Integration code generated in ${outputDir}`);
}

