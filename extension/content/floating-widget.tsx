/**
 * Floating Widget - Chat interface for browser extension
 * Adapted from ChatWindow.tsx for extension context
 */

import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { PageContext } from './context-extractor';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface FloatingWidgetProps {
  pageContext?: PageContext;
  suggestedActions?: string[];
  onClose?: () => void;
}

export function FloatingWidget({ pageContext, suggestedActions, onClose }: FloatingWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [autoContextEnabled, setAutoContextEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: window.innerWidth - 420, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Load greeting
  useEffect(() => {
    if (messages.length === 0) {
      const greeting = "Hello! I'm Assist, your AI companion. I can see what you're viewing and help you with anything on this page. How can I assist you?";
      setMessages([{
        id: '1',
        role: 'assistant',
        content: greeting,
        timestamp: new Date(),
      }]);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInputText = input.trim();
    setInput('');
    setLoading(true);

    try {
      // Build message with context if enabled
      let messageToSend = userInputText;
      if (autoContextEnabled && pageContext) {
        // Context will be added by background script
      }

      const response = await chrome.runtime.sendMessage({
        type: 'SEND_MESSAGE',
        payload: {
          message: messageToSend,
          conversation_id: 'extension-chat',
          pageContext: autoContextEnabled ? pageContext : undefined,
        },
      });

      let assistantContent = '';
      if (response && response.response) {
        assistantContent = response.response;
      } else if (response && response.error) {
        assistantContent = `Error: ${response.error}`;
      } else {
        assistantContent = 'I received your message, but couldn\'t generate a response.';
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please check your connection settings.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
    inputRef.current?.focus();
  };

  // Drag handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.chat-header')) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStartRef.current.x,
          y: e.clientY - dragStartRef.current.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const widgetStyle: React.CSSProperties = {
    position: 'fixed',
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: '400px',
    height: isMinimized ? '60px' : '600px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 2147483647,
    transition: isDragging ? 'none' : 'height 0.3s ease',
    overflow: 'hidden',
  };

  return (
    <div ref={widgetRef} style={widgetStyle} onMouseDown={handleMouseDown}>
      <div className="chat-header" style={{
        padding: '12px 16px',
        borderBottom: '1px solid #e5e7eb',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'move',
        userSelect: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 600 }}>Assist</span>
          {pageContext && (
            <span style={{ fontSize: '12px', opacity: 0.9 }}>
              • {pageContext.pageType}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setAutoContextEnabled(!autoContextEnabled)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
            title={autoContextEnabled ? 'Context enabled' : 'Context disabled'}
          >
            {autoContextEnabled ? '👁️' : '👁️‍🗨️'}
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {isMinimized ? '□' : '−'}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {!isMinimized && (
        <>
          {suggestedActions && suggestedActions.length > 0 && (
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid #e5e7eb',
              background: '#f9fafb',
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Quick actions:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {suggestedActions.slice(0, 3).map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickAction(action)}
                    style={{
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      color: '#374151',
                    }}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: '#f9fafb',
          }}>
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  maxWidth: '80%',
                  alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: message.role === 'user' 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'white',
                  color: message.role === 'user' ? 'white' : '#1f2937',
                  border: message.role === 'assistant' ? '1px solid #e5e7eb' : 'none',
                  wordWrap: 'break-word',
                  whiteSpace: 'pre-wrap',
                  fontSize: '14px',
                  lineHeight: '1.5',
                }}>
                  {message.content}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#9ca3af',
                  marginTop: '4px',
                  padding: '0 4px',
                }}>
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{
                display: 'flex',
                gap: '4px',
                padding: '10px',
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  background: '#9ca3af',
                  borderRadius: '50%',
                  animation: 'typing 1.4s infinite',
                }}></span>
                <span style={{
                  width: '8px',
                  height: '8px',
                  background: '#9ca3af',
                  borderRadius: '50%',
                  animation: 'typing 1.4s infinite',
                  animationDelay: '0.2s',
                }}></span>
                <span style={{
                  width: '8px',
                  height: '8px',
                  background: '#9ca3af',
                  borderRadius: '50%',
                  animation: 'typing 1.4s infinite',
                  animationDelay: '0.4s',
                }}></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} style={{
            padding: '12px 16px',
            borderTop: '1px solid #e5e7eb',
            background: 'white',
            display: 'flex',
            gap: '8px',
          }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              style={{
                flex: 1,
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
              }}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              style={{
                padding: '10px 20px',
                background: loading ? '#d1d5db' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Send
            </button>
          </form>
        </>
      )}
    </div>
  );
}

/**
 * Initialize widget when script loads
 */
function initializeWidget() {
  // Find container or create it
  let container = document.getElementById('assist-floating-widget');
  if (!container) {
    container = document.createElement('div');
    container.id = 'assist-floating-widget';
    document.body.appendChild(container);
  }

  // Get context from data attribute or event
  let pageContext: PageContext | undefined;
  let suggestedActions: string[] | undefined;

  const contextAttr = container.getAttribute('data-context');
  const actionsAttr = container.getAttribute('data-actions');
  
  if (contextAttr) {
    try {
      pageContext = JSON.parse(contextAttr);
    } catch (e) {
      console.error('Failed to parse context:', e);
    }
  }

  if (actionsAttr) {
    try {
      suggestedActions = JSON.parse(actionsAttr);
    } catch (e) {
      console.error('Failed to parse actions:', e);
    }
  }

  // Listen for init event
  container.addEventListener('assist-init-widget', ((e: CustomEvent) => {
    pageContext = e.detail.pageContext;
    suggestedActions = e.detail.suggestedActions;
    renderWidget();
  }) as EventListener);

  // Listen for context updates
  container.addEventListener('assist-update-context', ((e: CustomEvent) => {
    pageContext = e.detail.context;
    suggestedActions = e.detail.suggestedActions;
    // Re-render with new context
    renderWidget();
  }) as EventListener);

  function renderWidget() {
    // Clear existing React root if any
    const existingRoot = (container as any)._reactRoot;
    if (existingRoot) {
      existingRoot.unmount();
    }

    // Render React component
    const root = createRoot(container!);
    (container as any)._reactRoot = root;
    
    root.render(
      <FloatingWidget
        pageContext={pageContext}
        suggestedActions={suggestedActions}
        onClose={() => {
          container?.remove();
          root.unmount();
        }}
      />
    );
  }

  // Initial render if we have context
  if (pageContext || suggestedActions) {
    renderWidget();
  }
}

// Auto-initialize when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeWidget);
} else {
  initializeWidget();
}
