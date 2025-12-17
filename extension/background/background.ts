/**
 * Background Service Worker
 * Manages API connections, routes messages, and handles extension lifecycle
 */

import { apiClient, ChatRequest, ChatResponse } from './api-client';

// Initialize API client on service worker startup
chrome.runtime.onInstalled.addListener(() => {
  console.log('Assist extension installed');
  // Start health checks
  apiClient.startHealthChecks(30000); // Check every 30 seconds
  // Initial connection check
  apiClient.checkConnection();
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {
    handleMessage(message, sender)
      .then(sendResponse)
      .catch((error) => {
        console.error('Error handling message:', error);
        sendResponse({ error: error.message });
      });
    return true; // Keep channel open for async response
  }
);

async function handleMessage(
  message: any,
  sender: chrome.runtime.MessageSender
): Promise<any> {
  switch (message.type) {
    case 'SEND_MESSAGE':
      return handleSendMessage(message.payload);
    
    case 'CHECK_CONNECTION':
      return handleCheckConnection();
    
    case 'GET_CONNECTION_STATUS':
      return handleGetConnectionStatus();
    
    case 'SET_TOKEN':
      return handleSetToken(message.payload);
    
    case 'GET_TOKEN':
      return handleGetToken();
    
    case 'UPDATE_CONFIG':
      return handleUpdateConfig(message.payload);
    
    case 'GET_CONFIG':
      return handleGetConfig();
    
    case 'REQUEST_AUTOFILL_SUGGESTIONS':
      return handleRequestAutofillSuggestions(message.payload);
    
    case 'ANALYZE_IMAGE':
      return handleAnalyzeImage(message.payload);
    
    default:
      throw new Error(`Unknown message type: ${message.type}`);
  }
}

async function handleSendMessage(payload: ChatRequest): Promise<ChatResponse> {
  try {
    const response = await apiClient.sendMessage(payload);
    return response;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

async function handleCheckConnection() {
  const status = await apiClient.checkConnection();
  return { status };
}

async function handleGetConnectionStatus() {
  const status = apiClient.getConnectionStatus();
  return { status };
}

async function handleSetToken(payload: { token: string | null }) {
  await apiClient.setToken(payload.token);
  return { success: true };
}

async function handleGetToken() {
  const result = await chrome.storage.local.get(['auth_token', 'assisant_ai_token']);
  return { token: result.assisant_ai_token || result.auth_token || null };
}

async function handleUpdateConfig(payload: any) {
  await apiClient.updateConfig(payload);
  return { success: true };
}

async function handleGetConfig() {
  const result = await chrome.storage.sync.get(['apiConfig']);
  return { config: result.apiConfig || null };
}

async function handleRequestAutofillSuggestions(payload: any) {
  try {
    // Forward to API client for AI analysis
    const response = await apiClient.sendMessage({
      message: `Analyze this form and suggest values for the fields. Fields: ${JSON.stringify(payload.fields)}. Page context: ${JSON.stringify(payload.pageContext)}`,
      conversation_id: 'autofill-suggestions',
      pageContext: payload.pageContext,
    });

    // Parse response to extract suggestions
    // This is a simplified version - in production, the backend should return structured suggestions
    return {
      suggestions: [], // Will be populated by backend response parsing
    };
  } catch (error) {
    console.error('Error requesting autofill suggestions:', error);
    return { suggestions: [] };
  }
}

async function handleAnalyzeImage(payload: any) {
  try {
    // Forward image analysis to backend
    const status = apiClient.getConnectionStatus();
    const config = await chrome.storage.sync.get(['apiConfig']);
    const backendUrl = status.backend === 'local' 
      ? (config.apiConfig?.localBackendUrl || 'http://localhost:4202')
      : (config.apiConfig?.cloudBackendUrl);
    
    if (!backendUrl) {
      return { error: 'No backend available' };
    }

    const token = await handleGetToken();
    const response = await fetch(`${backendUrl}/api/image/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token.token ? { 'Authorization': `Bearer ${token.token}` } : {}),
      },
      body: JSON.stringify({
        image_base64: payload.imageBase64,
        question: payload.question || 'Describe this image in detail.',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return { description: data.description || data.response };
    }

    return { error: 'Failed to analyze image' };
  } catch (error) {
    console.error('Error analyzing image:', error);
    return { error: 'Failed to analyze image' };
  }
}

// Handle tab updates to check if we need to refresh context
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Notify content script that page has loaded
    chrome.tabs.sendMessage(tabId, {
      type: 'PAGE_LOADED',
      url: tab.url,
    }).catch(() => {
      // Content script might not be ready, ignore error
    });
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // This is handled by the popup, but we can add logic here if needed
});

// Keep service worker alive
chrome.runtime.onConnect.addListener((port) => {
  port.onDisconnect.addListener(() => {
    // Connection closed
  });
});
