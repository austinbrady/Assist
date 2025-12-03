import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Modal, 
  LayoutChangeEvent 
} from 'react-native';
import axios, { AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = __DEV__ ? 'http://localhost:8000' : 'https://api.mvpassistant.com';

// Time gap in milliseconds to create a new section (30 minutes)
const SECTION_TIME_GAP = 30 * 60 * 1000;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface Conversation {
  id: string;
  summary: string;
  updated_at: string;
  message_count: number;
}

interface MessageSection {
  id: string;
  timestamp: string;
  messages: Message[];
}

interface ConversationResponse {
  conversation_id: string;
  response: string;
}

interface ConversationsListResponse {
  conversations: Conversation[];
}

interface ConversationDetailResponse {
  conversation_id: string;
  username: string;
  created_at: string;
  updated_at: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
}

interface KeyboardEvent {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  preventDefault: () => void;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(-1);
  const scrollViewRef = useRef<ScrollView>(null);
  const sectionRefs = useRef<Record<string, View | null>>({});
  const sectionPositions = useRef<Record<string, number>>({});
  const sectionsRef = useRef<MessageSection[]>([]);

  // Group messages into sections based on time gaps
  const groupMessagesIntoSections = (msgs: Message[]): MessageSection[] => {
    if (msgs.length === 0) return [];

    const sections: MessageSection[] = [];
    let currentSection: MessageSection | null = null;

    msgs.forEach((msg, index) => {
      const msgTime = msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now();
      
      if (!currentSection) {
        // First message - start first section
        currentSection = {
          id: `section-${index}`,
          timestamp: msg.timestamp || new Date().toISOString(),
          messages: [msg],
        };
      } else {
        const lastMsgTime = currentSection.messages[currentSection.messages.length - 1].timestamp
          ? new Date(currentSection.messages[currentSection.messages.length - 1].timestamp!).getTime()
          : Date.now();
        
        const timeDiff = msgTime - lastMsgTime;

        if (timeDiff > SECTION_TIME_GAP) {
          // Time gap is large enough - start new section
          sections.push(currentSection);
          currentSection = {
            id: `section-${index}`,
            timestamp: msg.timestamp || new Date().toISOString(),
            messages: [msg],
          };
        } else {
          // Continue current section
          currentSection.messages.push(msg);
        }
      }
    });

    // Add the last section
    if (currentSection) {
      sections.push(currentSection);
    }

    sectionsRef.current = sections;
    return sections;
  };

  useEffect(() => {
    if (messages.length > 0) {
    scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Handle keyboard navigation (works on web/desktop with external keyboards)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // PageDown or Ctrl+Down for next section
      if (e.key === 'PageDown' || (e.key === 'ArrowDown' && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        navigateToNextSection();
      } 
      // PageUp or Ctrl+Up for previous section
      else if (e.key === 'PageUp' || (e.key === 'ArrowUp' && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        navigateToPreviousSection();
      }
    };

    // For web/desktop environments
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyPress as unknown as EventListener);
      return () => window.removeEventListener('keydown', handleKeyPress as unknown as EventListener);
    }
  }, [messages, currentSectionIndex]);

  const handleSectionLayout = (sectionId: string, event: LayoutChangeEvent): void => {
    const { y } = event.nativeEvent.layout;
    sectionPositions.current[sectionId] = y;
  };

  const navigateToSection = (sectionIndex: number): void => {
    const sections = sectionsRef.current;
    if (sectionIndex < 0 || sectionIndex >= sections.length) return;

    const section = sections[sectionIndex];
    const sectionId = section.id;
    const yPosition = sectionPositions.current[sectionId];

    if (yPosition !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: Math.max(0, yPosition - 20), animated: true });
      setCurrentSectionIndex(sectionIndex);
    } else {
      // Position not yet measured, set index anyway
      setCurrentSectionIndex(sectionIndex);
    }
  };

  const navigateToNextSection = (): void => {
    const sections = sectionsRef.current;
    const nextIndex = currentSectionIndex < 0 ? 0 : currentSectionIndex + 1;
    if (nextIndex < sections.length) {
      navigateToSection(nextIndex);
    }
  };

  const navigateToPreviousSection = (): void => {
    const sections = sectionsRef.current;
    const prevIndex = currentSectionIndex <= 0 ? sections.length - 1 : currentSectionIndex - 1;
    if (prevIndex >= 0) {
      navigateToSection(prevIndex);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async (): Promise<void> => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;

      const response: AxiosResponse<ConversationsListResponse> = await axios.get(
        `${API_BASE_URL}/api/conversations`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error('Load conversations error:', error);
    }
  };

  const loadConversation = async (convId: string): Promise<void> => {
    try {
      setLoadingHistory(true);
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;

      const response: AxiosResponse<ConversationDetailResponse> = await axios.get(
        `${API_BASE_URL}/api/conversations/${convId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const conversation = response.data;
      const loadedMessages: Message[] = conversation.messages.map((msg, index: number) => ({
        id: `${convId}-${index}`,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      }));

      setMessages(loadedMessages);
      setConversationId(convId);
      setShowHistory(false);
      setCurrentSectionIndex(-1);
      sectionPositions.current = {};
    } catch (error) {
      console.error('Load conversation error:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const startNewConversation = (): void => {
    setMessages([]);
    setConversationId(null);
    setShowHistory(false);
    setCurrentSectionIndex(-1);
    sectionPositions.current = {};
  };

  const handleSend = async (): Promise<void> => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const response: AxiosResponse<ConversationResponse> = await axios.post(
        `${API_BASE_URL}/api/chat`,
        { 
          message: currentInput,
          conversation_id: conversationId || undefined
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Update conversation ID if this was a new conversation
      if (response.data.conversation_id && !conversationId) {
        setConversationId(response.data.conversation_id);
      }

      // Refresh conversations list
      await loadConversations();
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const formatSectionTimestamp = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (messageDate.getTime() === today.getTime()) {
      // Today - show time
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (messageDate.getTime() === today.getTime() - 86400000) {
      // Yesterday
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      // Older - show date and time
      return date.toLocaleString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  const sections = groupMessagesIntoSections(messages);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Header with history button - only show when not in tab navigator */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Home</Text>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => setShowHistory(true)}
        >
          <Text style={styles.historyButtonText}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Chat History Modal */}
      <Modal
        visible={showHistory}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chat History</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowHistory(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.newChatButton}
            onPress={startNewConversation}
          >
            <Text style={styles.newChatButtonText}>+ New Chat</Text>
          </TouchableOpacity>

          <ScrollView style={styles.conversationsList}>
            {conversations.length === 0 ? (
              <View style={styles.emptyHistoryState}>
                <Text style={styles.emptyHistoryText}>No conversations yet</Text>
                <Text style={styles.emptyHistorySubtext}>Start a new chat to begin</Text>
              </View>
            ) : (
              conversations.map((conv) => (
                <TouchableOpacity
                  key={conv.id}
                  style={[
                    styles.conversationItem,
                    conversationId === conv.id && styles.conversationItemActive
                  ]}
                  onPress={() => loadConversation(conv.id)}
                >
                  <View style={styles.conversationContent}>
                    <Text 
                      style={styles.conversationSummary}
                      numberOfLines={2}
                    >
                      {conv.summary}
                    </Text>
                    <View style={styles.conversationMeta}>
                      <Text style={styles.conversationMetaText}>
                        {conv.message_count} messages
                      </Text>
                      <Text style={styles.conversationMetaText}>
                        {formatDate(conv.updated_at)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Navigation buttons for sections */}
      {sections.length > 1 && (
        <View style={styles.sectionNavigation}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={navigateToPreviousSection}
          >
            <Text style={styles.navButtonText}>↑ Prev</Text>
          </TouchableOpacity>
          <Text style={styles.sectionCounter}>
            {currentSectionIndex >= 0 ? currentSectionIndex + 1 : 0} / {sections.length}
          </Text>
          <TouchableOpacity
            style={styles.navButton}
            onPress={navigateToNextSection}
          >
            <Text style={styles.navButtonText}>Next ↓</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Start a conversation with your assistant!</Text>
            <Text style={styles.emptySubtext}>Tap "History" to resume a previous chat</Text>
            {Platform.OS === 'web' && (
              <Text style={styles.emptySubtext}>Use Page Up/Down to navigate sections</Text>
            )}
          </View>
        )}

        {sections.map((section, sectionIndex) => (
          <View key={section.id}>
            {/* Section timestamp header */}
            <View
              ref={(ref) => {
                sectionRefs.current[section.id] = ref;
              }}
              onLayout={(event) => handleSectionLayout(section.id, event)}
              style={styles.sectionHeader}
            >
              <View style={styles.sectionHeaderLine} />
              <Text style={styles.sectionHeaderText}>
                {formatSectionTimestamp(section.timestamp)}
              </Text>
              <View style={styles.sectionHeaderLine} />
            </View>

            {/* Messages in this section */}
            {section.messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.message,
              msg.role === 'user' ? styles.userMessage : styles.assistantMessage,
            ]}
          >
                <Text style={[
                  styles.messageText,
                  msg.role === 'user' && styles.userMessageText
                ]}>
                  {msg.content}
                </Text>
              </View>
            ))}
          </View>
        ))}

        {loading && (
          <View style={[styles.message, styles.assistantMessage]}>
            <Text style={styles.messageText}>Thinking...</Text>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type your message..."
          multiline
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || loading}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  historyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#6366f1',
    borderRadius: 8,
  },
  historyButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  closeButtonText: {
    color: '#6366f1',
    fontWeight: '600',
    fontSize: 14,
  },
  newChatButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    alignItems: 'center',
  },
  newChatButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  conversationsList: {
    flex: 1,
  },
  conversationItem: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  conversationItemActive: {
    borderColor: '#6366f1',
    borderWidth: 2,
    backgroundColor: '#eef2ff',
  },
  conversationContent: {
    flex: 1,
  },
  conversationSummary: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 8,
    fontWeight: '500',
  },
  conversationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  conversationMetaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyHistoryState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyHistorySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  message: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#6366f1',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
  },
  messageText: {
    fontSize: 16,
    color: '#111827',
  },
  userMessageText: {
    color: 'white',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#6366f1',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  sectionNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  navButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  navButtonText: {
    color: '#6366f1',
    fontWeight: '600',
    fontSize: 12,
  },
  sectionCounter: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    marginHorizontal: 16,
  },
  sectionHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  sectionHeaderText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
});
