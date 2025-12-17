import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Image, 
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QRCode from 'react-native-qrcode-svg';

// Auto-detect API URL
const getApiUrl = () => {
  return __DEV__ ? 'http://localhost:8000' : 'http://YOUR_SERVER_IP:8000';
};

const API_BASE_URL = getApiUrl();

// Token storage keys
const TOKEN_KEY = '@PersonalAI:token';
const USERNAME_KEY = '@PersonalAI:username';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Beautiful iOS-style colors
const colors = {
  primary: '#007AFF',
  primaryDark: '#0051D5',
  background: '#F2F2F7',
  card: '#FFFFFF',
  text: '#000000',
  textSecondary: '#8E8E93',
  border: '#E5E5EA',
  success: '#34C759',
  error: '#FF3B30',
  warning: '#FF9500',
  purple: '#5856D6',
  pink: '#FF2D55',
  orange: '#FF9500',
  green: '#34C759',
  blue: '#007AFF',
};

// Assistant data
const ASSISTANTS = [
  {
    id: 'michael',
    name: 'Michael',
    description: 'Leader of Heaven\'s armies',
    color: '#4A90E2',
    icon: 'shield',
  },
  {
    id: 'gabriel',
    name: 'Gabriel',
    description: 'Messenger of God',
    color: '#FFD700',
    icon: 'mail',
  },
  {
    id: 'raphael',
    name: 'Raphael',
    description: 'The Healer',
    color: '#50C878',
    icon: 'medical',
  },
  {
    id: 'uriel',
    name: 'Uriel',
    description: 'The Light of God',
    color: '#FF6B35',
    icon: 'bulb',
  },
  {
    id: 'ariel',
    name: 'Ariel',
    description: 'Lion of God',
    color: '#C41E3A',
    icon: 'flame',
  },
  {
    id: 'jophiel',
    name: 'Jophiel',
    description: 'Beauty of God',
    color: '#9B59B6',
    icon: 'color-palette',
  },
  {
    id: 'chamuel',
    name: 'Chamuel',
    description: 'He Who Seeks God',
    color: '#FF69B4',
    icon: 'heart',
  },
];

// Login Screen
function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        username: username.trim(),
        password: password,
      });

      // Store token and username
      if (response.data.token) {
        await AsyncStorage.setItem(TOKEN_KEY, response.data.token);
        await AsyncStorage.setItem(USERNAME_KEY, username.trim());
        
        // Check if user needs to select assistant
        if (response.data.assistant) {
          navigation.replace('Main');
        } else {
          navigation.replace('AssistantSelect');
        }
      }
    } catch (error) {
      Alert.alert('Login Failed', error.response?.data?.detail || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.loginContainer}>
      <StatusBar style="dark" />
      <Animated.View style={[styles.loginContent, { opacity: fadeAnim }]}>
        <View style={styles.loginHeader}>
          <View style={styles.logoContainer}>
            <Ionicons name="sparkles" size={64} color={colors.primary} />
          </View>
          <Text style={styles.loginTitle}>Personal AI</Text>
          <Text style={styles.loginSubtitle}>Your spiritual companion</Text>
        </View>

        <View style={styles.loginForm}>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor={colors.textSecondary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons 
                name={showPassword ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signUpButton}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.signUpButtonText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

// Sign Up Screen
function SignUpScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSignUp = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/signup`, {
        username: username.trim(),
        password: password,
      });

      if (response.data.token) {
        await AsyncStorage.setItem(TOKEN_KEY, response.data.token);
        await AsyncStorage.setItem(USERNAME_KEY, username.trim());
        
        Alert.alert('Success', 'Account created!', [
          { text: 'OK', onPress: () => navigation.replace('AssistantSelect') }
        ]);
      }
    } catch (error) {
      Alert.alert('Sign Up Failed', error.response?.data?.detail || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.loginContainer}>
      <StatusBar style="dark" />
      <Animated.View style={[styles.loginContent, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.loginHeader}>
          <Text style={styles.loginTitle}>Create Account</Text>
          <Text style={styles.loginSubtitle}>Join Personal AI</Text>
        </View>

        <View style={styles.loginForm}>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor={colors.textSecondary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor={colors.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

// Assistant Selection Screen
function AssistantSelectScreen({ navigation }) {
  const [selectedAssistant, setSelectedAssistant] = useState(null);
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSelectAssistant = async (assistant) => {
    setSelectedAssistant(assistant.id);
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) {
        Alert.alert('Error', 'Please login first');
        navigation.replace('Login');
        return;
      }

      await axios.post(
        `${API_BASE_URL}/api/auth/select-assistant`,
        { assistant_id: assistant.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      navigation.replace('Main');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || error.message);
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.assistantContainer}>
      <StatusBar style="dark" />
      <Animated.View style={[styles.assistantContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.assistantHeader}>
          <Text style={styles.assistantTitle}>Choose Your Companion</Text>
          <Text style={styles.assistantSubtitle}>Select an AI assistant to guide you</Text>
        </View>

        <ScrollView 
          style={styles.assistantScroll}
          contentContainerStyle={styles.assistantScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {ASSISTANTS.map((assistant, index) => (
            <Animated.View
              key={assistant.id}
              style={[
                styles.assistantCard,
                selectedAssistant === assistant.id && styles.assistantCardSelected,
                { 
                  opacity: fadeAnim,
                  transform: [{ 
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 50],
                      outputRange: [0, 50 + (index * 20)],
                    })
                  }]
                }
              ]}
            >
              <TouchableOpacity
                style={styles.assistantCardTouchable}
                onPress={() => handleSelectAssistant(assistant)}
                disabled={loading}
                activeOpacity={0.7}
              >
                <View style={[styles.assistantIconContainer, { backgroundColor: assistant.color + '20' }]}>
                  <Ionicons name={assistant.icon} size={32} color={assistant.color} />
                </View>
                <View style={styles.assistantCardContent}>
                  <Text style={styles.assistantCardName}>{assistant.name}</Text>
                  <Text style={styles.assistantCardDescription}>{assistant.description}</Text>
                </View>
                {selectedAssistant === assistant.id && (
                  <View style={[styles.checkmarkContainer, { backgroundColor: assistant.color }]}>
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

// Chat Screen with beautiful iOS design
function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = input;
    setInput('');
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const response = await axios.post(
        `${API_BASE_URL}/api/chat`,
        {
          message: messageText,
          conversation_id: conversationId,
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
      };

      setConversationId(response.data.conversation_id);
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.chatContainer} edges={['top']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.chatKeyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <Animated.View style={[styles.chatContent, { opacity: fadeAnim }]}>
          {messages.length === 0 ? (
          <View style={styles.welcomeContainer}>
              <View style={styles.welcomeIconContainer}>
                <Ionicons name="chatbubbles" size={64} color={colors.primary} />
          </View>
              <Text style={styles.welcomeText}>Welcome to Personal AI</Text>
              <Text style={styles.welcomeSubtext}>Start a conversation with your spiritual companion</Text>
            </View>
          ) : (
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((msg, index) => (
                <Animated.View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.role === 'user' ? styles.userMessage : styles.assistantMessage,
                    {
                      opacity: fadeAnim,
                      transform: [{
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        })
                      }]
                    }
                  ]}
                >
                  <Text style={[
                    styles.messageText,
                    msg.role === 'user' && styles.userMessageText
                  ]}>
                    {msg.content}
                  </Text>
                </Animated.View>
              ))}
              {loading && (
                <View style={styles.typingIndicator}>
                  <View style={styles.typingDot} />
                  <View style={[styles.typingDot, styles.typingDotDelay1]} />
                  <View style={[styles.typingDot, styles.typingDotDelay2]} />
                </View>
              )}
      </ScrollView>
          )}

      <View style={styles.inputContainer}>
            <View style={styles.inputWrapperChat}>
        <TextInput
                style={styles.inputChat}
          value={input}
          onChangeText={setInput}
                placeholder="Type a message..."
                placeholderTextColor={colors.textSecondary}
          multiline
                maxLength={1000}
          onSubmitEditing={sendMessage}
                returnKeyType="send"
        />
        <TouchableOpacity
                style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
          onPress={sendMessage}
                disabled={!input.trim() || loading}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="arrow-up" 
                  size={20} 
                  color={input.trim() && !loading ? "#fff" : colors.textSecondary} 
                />
        </TouchableOpacity>
      </View>
    </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Generate Screen
function GenerateScreen() {
  const [imagePrompt, setImagePrompt] = useState('');
  const [videoPrompt, setVideoPrompt] = useState('');
  const [songPrompt, setSongPrompt] = useState('');
  const [songForFansOf, setSongForFansOf] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || generating) return;
    setGenerating(true);
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const response = await axios.post(
        `${API_BASE_URL}/api/image/generate`,
        { prompt: imagePrompt },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setGeneratedImage(`${API_BASE_URL}/api/image/${response.data.file_id}`);
      Alert.alert('Success', 'Image generated!');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim() || generating) return;
    setGenerating(true);
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      await axios.post(
        `${API_BASE_URL}/api/video/generate`,
        { prompt: videoPrompt },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      Alert.alert('Success', 'Video generated!');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateSong = async () => {
    if (!songPrompt.trim() || generating) return;
    setGenerating(true);
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const response = await axios.post(
        `${API_BASE_URL}/api/song/generate`,
        {
          prompt: songPrompt,
          for_fans_of: songForFansOf.trim() || undefined,
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      Alert.alert('Success', 'Song generated!');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || error.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.generateContainer} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView 
        style={styles.generateScroll}
        contentContainerStyle={styles.generateContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Image Generation Card */}
          <View style={styles.generateCard}>
            <View style={styles.generateCardHeader}>
              <View style={[styles.generateIconContainer, { backgroundColor: colors.pink + '20' }]}>
                <Ionicons name="image" size={24} color={colors.pink} />
              </View>
              <Text style={styles.generateCardTitle}>Generate Image</Text>
            </View>
        <TextInput
              style={styles.generateInput}
          value={imagePrompt}
          onChangeText={setImagePrompt}
              placeholder="Describe the image you want to create..."
              placeholderTextColor={colors.textSecondary}
          multiline
        />
        <TouchableOpacity
              style={[styles.generateButton, styles.imageButton, generating && styles.generateButtonDisabled]}
          onPress={handleGenerateImage}
          disabled={generating}
              activeOpacity={0.8}
        >
              <Ionicons name="sparkles" size={20} color="#fff" />
              <Text style={styles.generateButtonText}>Generate</Text>
        </TouchableOpacity>
        {generatedImage && (
          <Image source={{ uri: generatedImage }} style={styles.generatedImage} />
        )}
      </View>

          {/* Video Generation Card */}
          <View style={styles.generateCard}>
            <View style={styles.generateCardHeader}>
              <View style={[styles.generateIconContainer, { backgroundColor: colors.purple + '20' }]}>
                <Ionicons name="videocam" size={24} color={colors.purple} />
              </View>
              <Text style={styles.generateCardTitle}>Generate Video</Text>
            </View>
        <TextInput
              style={styles.generateInput}
          value={videoPrompt}
          onChangeText={setVideoPrompt}
              placeholder="Describe the video you want to create..."
              placeholderTextColor={colors.textSecondary}
          multiline
        />
        <TouchableOpacity
              style={[styles.generateButton, styles.videoButton, generating && styles.generateButtonDisabled]}
          onPress={handleGenerateVideo}
          disabled={generating}
              activeOpacity={0.8}
        >
              <Ionicons name="play" size={20} color="#fff" />
              <Text style={styles.generateButtonText}>Generate</Text>
        </TouchableOpacity>
      </View>

          {/* Song Generation Card */}
          <View style={styles.generateCard}>
            <View style={styles.generateCardHeader}>
              <View style={[styles.generateIconContainer, { backgroundColor: colors.orange + '20' }]}>
                <Ionicons name="musical-notes" size={24} color={colors.orange} />
              </View>
              <Text style={styles.generateCardTitle}>Write Song</Text>
            </View>
        <TextInput
              style={styles.generateInput}
          value={songPrompt}
          onChangeText={setSongPrompt}
              placeholder="Song title or theme..."
              placeholderTextColor={colors.textSecondary}
        />
        <TextInput
              style={[styles.generateInput, styles.marginTop]}
          value={songForFansOf}
          onChangeText={setSongForFansOf}
              placeholder="For fans of... (optional)"
              placeholderTextColor={colors.textSecondary}
        />
        <TouchableOpacity
              style={[styles.generateButton, styles.songButton, generating && styles.generateButtonDisabled]}
          onPress={handleGenerateSong}
          disabled={generating}
              activeOpacity={0.8}
        >
              <Ionicons name="musical-note" size={20} color="#fff" />
              <Text style={styles.generateButtonText}>Generate</Text>
        </TouchableOpacity>
      </View>
        </Animated.View>
    </ScrollView>
    </SafeAreaView>
  );
}

// Wallets Screen
function WalletsScreen({ navigation }) {
  const [allWallets, setAllWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const [addingWallet, setAddingWallet] = useState(false);
  const [generatingWallet, setGeneratingWallet] = useState(false);
  
  // Bitcoin wallet state
  const [bitcoinWallets, setBitcoinWallets] = useState(null);
  const [bitcoinLoading, setBitcoinLoading] = useState(true);
  const [showBitcoinTypes, setShowBitcoinTypes] = useState(false);
  const [hoveredType, setHoveredType] = useState(null);
  
  // Wallet action modal state
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletAction, setWalletAction] = useState(null); // 'send', 'receive', 'sendToken', 'sendNFT'
  const [sendToAddress, setSendToAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendMemo, setSendMemo] = useState('');
  const [sending, setSending] = useState(false);
  const [tokens, setTokens] = useState([]);
  const [nfts, setNfts] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [loadingNfts, setLoadingNfts] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);
  const [selectedNFT, setSelectedNFT] = useState(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Helper function to get wallet color
  const getWalletColor = (type) => {
    switch (type) {
      case 'BTC': return '#F7931A';
      case 'BCH': return '#0AC18E';
      case 'BSV': return '#EAB300';
      case 'SOL': return '#9945FF';
      case 'ETH': return '#627EEA';
      default: return colors.primary;
    }
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
    loadWallets();
    loadBitcoinWallets();
  }, []);

  useEffect(() => {
    // Set header right button
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          style={{ marginRight: 16, padding: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const loadWallets = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const wallets = [];
      
      // Load Bitcoin wallets (BTC, BCH, BSV)
      try {
        const btcResponse = await axios.get(`${API_BASE_URL}/api/wallet/bitcoin/all`, { headers });
        const btcWallet = btcResponse.data.wallet;
        if (btcWallet && btcWallet.addresses) {
          const addresses = btcWallet.addresses;
          if (addresses.BTC?.legacy) {
            wallets.push({ type: 'BTC', address: addresses.BTC.legacy, chain: 'BTC' });
          }
          if (addresses.BCH?.legacy) {
            wallets.push({ type: 'BCH', address: addresses.BCH.legacy, chain: 'BCH' });
          }
          if (addresses.BSV?.legacy) {
            wallets.push({ type: 'BSV', address: addresses.BSV.legacy, chain: 'BSV' });
          }
        }
      } catch (error) {
        console.log('Error loading Bitcoin wallets:', error.message);
      }
      
      // Load Ethereum wallet
      try {
        const ethResponse = await axios.get(`${API_BASE_URL}/api/wallet`, { headers });
        // Check for Ethereum address in ethereum object or addresses object
        const ethAddress = ethResponse.data.ethereum?.address || ethResponse.data.addresses?.ETH;
        if (ethAddress) {
          wallets.push({ 
            type: 'ETH', 
            address: ethAddress, 
            chain: 'ETH' 
          });
        }
      } catch (error) {
        console.log('Error loading Ethereum wallet:', error.message);
      }
      
      // Load Solana wallets
      try {
        const solResponse = await axios.get(`${API_BASE_URL}/api/wallet/solana/all`, { headers });
        const solWallets = solResponse.data.wallets || [];
        solWallets.forEach(wallet => {
          wallets.push({ 
            type: 'SOL', 
            address: wallet.address || wallet.public_key, 
            chain: 'SOL',
            created_at: wallet.created_at,
            imported: wallet.imported
          });
        });
      } catch (error) {
        console.log('Error loading Solana wallets:', error.message);
      }
      
      setAllWallets(wallets);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadBitcoinWallets = async () => {
    try {
      setBitcoinLoading(true);
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const response = await axios.get(`${API_BASE_URL}/api/wallet/bitcoin/all`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setBitcoinWallets(response.data);
    } catch (error) {
      console.error('Error loading Bitcoin wallets:', error);
      // Don't show alert for Bitcoin wallets, just log error
    } finally {
      setBitcoinLoading(false);
    }
  };

  const handleAddWallet = async () => {
    if (!privateKey.trim()) {
      Alert.alert('Error', 'Please enter a private key');
      return;
    }

    setAddingWallet(true);
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      await axios.post(
        `${API_BASE_URL}/api/wallet/solana/add`,
        { private_key: privateKey.trim() },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      Alert.alert('Success', 'Wallet added successfully!');
      setShowAddModal(false);
      setPrivateKey('');
      loadWallets();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || error.message);
    } finally {
      setAddingWallet(false);
    }
  };

  const handleGenerateWallet = async () => {
    setGeneratingWallet(true);
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      await axios.post(
        `${API_BASE_URL}/api/wallet/solana/generate`,
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      Alert.alert('Success', 'New wallet generated successfully!');
      loadWallets();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || error.message);
    } finally {
      setGeneratingWallet(false);
    }
  };

  const handleWalletPress = (wallet) => {
    setSelectedWallet(wallet);
    setShowWalletModal(true);
    setWalletAction(null);
    setSendToAddress('');
    setSendAmount('');
    setSendMemo('');
    setTokens([]);
    setNfts([]);
    setSelectedToken(null);
    setSelectedNFT(null);
  };

  const handleSendPayment = async () => {
    if (!sendToAddress.trim() || !sendAmount.trim() || parseFloat(sendAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid address and amount');
      return;
    }

    setSending(true);
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const chain = selectedWallet.chain.toLowerCase();
      await axios.post(
        `${API_BASE_URL}/api/wallet/send`,
        {
          chain: chain,
          to_address: sendToAddress.trim(),
          amount: parseFloat(sendAmount),
          memo: sendMemo.trim() || undefined
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      Alert.alert('Success', 'Payment sent successfully!');
      setWalletAction(null);
      setSendToAddress('');
      setSendAmount('');
      setSendMemo('');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || error.message);
    } finally {
      setSending(false);
    }
  };

  const loadTokens = async () => {
    if (!selectedWallet) return;
    setLoadingTokens(true);
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const chain = selectedWallet.chain.toLowerCase();
      const response = await axios.get(
        `${API_BASE_URL}/api/wallet/${chain}/tokens`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setTokens(response.data.tokens || []);
    } catch (error) {
      console.log('Error loading tokens:', error.message);
      setTokens([]);
    } finally {
      setLoadingTokens(false);
    }
  };

  const loadNFTs = async () => {
    if (!selectedWallet) return;
    setLoadingNfts(true);
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const chain = selectedWallet.chain.toLowerCase();
      const response = await axios.get(
        `${API_BASE_URL}/api/wallet/${chain}/nfts`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setNfts(response.data.nfts || []);
    } catch (error) {
      console.log('Error loading NFTs:', error.message);
      setNfts([]);
    } finally {
      setLoadingNfts(false);
    }
  };

  const handleActionSelect = (action) => {
    setWalletAction(action);
    if (action === 'sendToken') {
      loadTokens();
    } else if (action === 'sendNFT') {
      loadNFTs();
    }
  };

  const displayedWallets = expanded ? allWallets : (allWallets.length > 0 ? [allWallets[0]] : []);

  const renderBitcoinWalletType = (chain, type, data) => {
    if (!data || !data.address) return null;
    
    return (
      <TouchableOpacity
        key={`${chain}-${type}`}
        style={styles.bitcoinTypeCard}
        onPress={() => handleWalletPress({ type: chain, address: data.address, chain: chain })}
        onLongPress={() => {
          // Copy address on long press
          Alert.alert('Address', data.address);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.bitcoinTypeHeader}>
          <View style={styles.bitcoinTypeInfo}>
            <Text style={styles.bitcoinTypeName}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
            <Text style={styles.bitcoinTypeAddress} numberOfLines={1}>
              {data.address}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setHoveredType(hoveredType === `${chain}-${type}` ? null : `${chain}-${type}`)}
            style={styles.infoButton}
          >
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {hoveredType === `${chain}-${type}` && (
          <View style={styles.tooltipContainer}>
            <Text style={styles.tooltipTitle}>{data.description}</Text>
            <Text style={styles.tooltipText}>Use case: {data.use_case}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.walletsContainer} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView 
        style={styles.walletsScroll}
        contentContainerStyle={styles.walletsContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Bitcoin Section */}
          <View style={styles.walletSection}>
            <View style={styles.walletsHeader}>
              <Text style={styles.walletsTitle}>Bitcoin Wallets</Text>
              <Text style={styles.walletsSubtitle}>Multiple address types from same key</Text>
            </View>

            {bitcoinLoading ? (
              <View style={styles.walletsLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : bitcoinWallets ? (
              <>

              <TouchableOpacity
                style={styles.showTypesButton}
                onPress={() => setShowBitcoinTypes(!showBitcoinTypes)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={showBitcoinTypes ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={colors.primary} 
                />
                <Text style={styles.showTypesButtonText}>
                  {showBitcoinTypes ? 'Hide' : 'Show'} Different Address Types
                </Text>
              </TouchableOpacity>

              {showBitcoinTypes && bitcoinWallets.address_types && (
                <View style={styles.bitcoinTypesContainer}>
                  {/* BTC Address Types */}
                  {bitcoinWallets.address_types.BTC && (
                    <View style={styles.chainSection}>
                      <Text style={styles.chainTitle}>Bitcoin (BTC)</Text>
                      {bitcoinWallets.address_types.BTC.legacy && 
                        renderBitcoinWalletType('BTC', 'legacy', bitcoinWallets.address_types.BTC.legacy)}
                      {bitcoinWallets.address_types.BTC.taproot && 
                        renderBitcoinWalletType('BTC', 'taproot', bitcoinWallets.address_types.BTC.taproot)}
                      {bitcoinWallets.address_types.BTC.ordinals && 
                        renderBitcoinWalletType('BTC', 'ordinals', bitcoinWallets.address_types.BTC.ordinals)}
                    </View>
                  )}

                  {/* BSV Address Types */}
                  {bitcoinWallets.address_types.BSV && (
                    <View style={styles.chainSection}>
                      <Text style={styles.chainTitle}>Bitcoin SV (BSV)</Text>
                      {bitcoinWallets.address_types.BSV.legacy && 
                        renderBitcoinWalletType('BSV', 'legacy', bitcoinWallets.address_types.BSV.legacy)}
                      {bitcoinWallets.address_types.BSV.taproot && 
                        renderBitcoinWalletType('BSV', 'taproot', bitcoinWallets.address_types.BSV.taproot)}
                      {bitcoinWallets.address_types.BSV.ordinals && 
                        renderBitcoinWalletType('BSV', 'ordinals', bitcoinWallets.address_types.BSV.ordinals)}
                    </View>
                  )}

                  {/* BCH Address Types */}
                  {bitcoinWallets.address_types.BCH && (
                    <View style={styles.chainSection}>
                      <Text style={styles.chainTitle}>Bitcoin Cash (BCH)</Text>
                      {bitcoinWallets.address_types.BCH.legacy && 
                        renderBitcoinWalletType('BCH', 'legacy', bitcoinWallets.address_types.BCH.legacy)}
                    </View>
                  )}
                </View>
              )}

              {!showBitcoinTypes && bitcoinWallets.address_types && (
                <TouchableOpacity 
                  style={styles.walletCard}
                  onPress={() => {
                    const btcAddress = bitcoinWallets.address_types.BTC?.legacy?.address;
                    if (btcAddress) {
                      handleWalletPress({ type: 'BTC', address: btcAddress, chain: 'BTC' });
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.walletCardHeader}>
                    <View style={[styles.walletIconContainer, { backgroundColor: '#F7931A' + '20' }]}>
                      <Ionicons name="logo-bitcoin" size={24} color="#F7931A" />
                    </View>
                    <View style={styles.walletInfo}>
                      <Text style={styles.walletAddress} numberOfLines={1}>
                        {bitcoinWallets.address_types.BTC?.legacy?.address || 'Loading...'}
                      </Text>
                      <Text style={styles.walletDate}>
                        Legacy Address • Tap to view all types
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </View>
                </TouchableOpacity>
              )}
              </>
            ) : (
              <View style={styles.walletCard}>
                <Text style={styles.walletDate}>Bitcoin wallet will be created automatically</Text>
              </View>
            )}
          </View>

          {/* Solana Section */}
          <View style={styles.walletSection}>
          {loading ? (
            <View style={styles.walletsLoading}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : allWallets.length === 0 ? (
            <View style={styles.walletsEmpty}>
              <View style={styles.walletsEmptyIcon}>
                <Ionicons name="wallet-outline" size={64} color={colors.textSecondary} />
              </View>
              <Text style={styles.walletsEmptyText}>No wallets yet</Text>
              <Text style={styles.walletsEmptySubtext}>Wallets will be created automatically when you sign up</Text>
            </View>
          ) : (
            <>
              <View style={styles.walletsHeader}>
                <Text style={styles.walletsTitle}>Wallets</Text>
                <Text style={styles.walletsSubtitle}>{allWallets.length} wallet{allWallets.length !== 1 ? 's' : ''}</Text>
              </View>

              {displayedWallets.map((wallet, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.walletCard}
                  onPress={() => handleWalletPress(wallet)}
                  activeOpacity={0.7}
                >
                  <View style={styles.walletCardHeader}>
                    <View style={[styles.walletIconContainer, { backgroundColor: getWalletColor(wallet.type) + '20' }]}>
                      <Text style={[styles.walletTypeText, { color: getWalletColor(wallet.type) }]}>
                        {wallet.type}
                      </Text>
                    </View>
                    <View style={styles.walletInfo}>
                      <Text style={styles.walletTypeLabel}>{wallet.type}</Text>
                      <Text style={styles.walletAddress} numberOfLines={1}>
                        {wallet.address}
                      </Text>
                      {wallet.created_at && (
                      <Text style={styles.walletDate}>
                        {wallet.imported ? 'Imported' : 'Generated'} • {new Date(wallet.created_at).toLocaleDateString()}
                      </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </View>
                </TouchableOpacity>
              ))}

              {allWallets.length > 1 && (
                <TouchableOpacity
                  style={styles.expandButton}
                  onPress={() => setExpanded(!expanded)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.expandButtonText}>
                    {expanded ? 'Show Less' : `Show ${allWallets.length - 1} More`}
                  </Text>
                  <Ionicons 
                    name={expanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={colors.primary} 
                  />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.generateWalletButton, generatingWallet && styles.generateWalletButtonDisabled]}
                onPress={handleGenerateWallet}
                disabled={generatingWallet}
                activeOpacity={0.8}
              >
                {generatingWallet ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="add-circle" size={20} color="#fff" />
                    <Text style={styles.generateWalletButtonText}>Generate New Wallet</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Wallet Action Modal */}
      <Modal
        visible={showWalletModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowWalletModal(false);
          setWalletAction(null);
          setSelectedWallet(null);
        }}
      >
        <View style={styles.walletModalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.walletModalKeyboardView}
          >
            <View style={styles.walletModalContent}>
              <View style={styles.walletModalHeader}>
                <Text style={styles.walletModalTitle}>
                  {selectedWallet ? `${selectedWallet.type} Wallet` : 'Wallet'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowWalletModal(false);
                    setWalletAction(null);
                    setSelectedWallet(null);
                  }}
                  style={styles.walletModalCloseButton}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {!walletAction ? (
                <View style={styles.walletActionButtons}>
                  <TouchableOpacity
                    style={styles.walletActionButton}
                    onPress={() => handleActionSelect('send')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.walletActionIcon, { backgroundColor: colors.primary + '20' }]}>
                      <Ionicons name="arrow-up" size={24} color={colors.primary} />
                    </View>
                    <Text style={styles.walletActionText}>SEND PAYMENT</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.walletActionButton}
                    onPress={() => handleActionSelect('receive')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.walletActionIcon, { backgroundColor: colors.success + '20' }]}>
                      <Ionicons name="arrow-down" size={24} color={colors.success} />
                    </View>
                    <Text style={styles.walletActionText}>RECEIVE PAYMENT</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.walletActionButton}
                    onPress={() => handleActionSelect('sendToken')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.walletActionIcon, { backgroundColor: colors.purple + '20' }]}>
                      <Ionicons name="diamond" size={24} color={colors.purple} />
                    </View>
                    <Text style={styles.walletActionText}>SEND TOKEN</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.walletActionButton}
                    onPress={() => handleActionSelect('sendNFT')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.walletActionIcon, { backgroundColor: colors.pink + '20' }]}>
                      <Ionicons name="image" size={24} color={colors.pink} />
                    </View>
                    <Text style={styles.walletActionText}>SEND NFT</Text>
                  </TouchableOpacity>
                </View>
              ) : walletAction === 'send' ? (
                <ScrollView style={styles.walletActionScroll} showsVerticalScrollIndicator={false}>
                  <View style={styles.walletActionForm}>
                    <Text style={styles.walletActionLabel}>Recipient Address</Text>
                    <TextInput
                      style={styles.walletActionInput}
                      value={sendToAddress}
                      onChangeText={setSendToAddress}
                      placeholder="Enter recipient address"
                      placeholderTextColor={colors.textSecondary}
                      autoCapitalize="none"
                    />

                    <Text style={styles.walletActionLabel}>Amount</Text>
                    <TextInput
                      style={styles.walletActionInput}
                      value={sendAmount}
                      onChangeText={setSendAmount}
                      placeholder="0.00"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="decimal-pad"
                    />

                    <Text style={styles.walletActionLabel}>Memo (Optional)</Text>
                    <TextInput
                      style={[styles.walletActionInput, styles.walletActionTextArea]}
                      value={sendMemo}
                      onChangeText={setSendMemo}
                      placeholder="Add a note..."
                      placeholderTextColor={colors.textSecondary}
                      multiline
                      numberOfLines={3}
                    />

                    <TouchableOpacity
                      style={[styles.walletActionSubmitButton, sending && styles.walletActionSubmitButtonDisabled]}
                      onPress={handleSendPayment}
                      disabled={sending}
                      activeOpacity={0.8}
                    >
                      {sending ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.walletActionSubmitText}>Send Payment</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              ) : walletAction === 'receive' ? (
                <ScrollView style={styles.walletActionScroll} showsVerticalScrollIndicator={false}>
                  <View style={styles.receiveContainer}>
                    <Text style={styles.receiveLabel}>Your {selectedWallet?.type} Address</Text>
                    <View style={styles.qrCodeContainer}>
                      <QRCode
                        value={selectedWallet?.address || ''}
                        size={250}
                        color={colors.text}
                        backgroundColor={colors.card}
                      />
                    </View>
                    <View style={styles.addressContainer}>
                      <Text style={styles.addressText} selectable>
                        {selectedWallet?.address}
                      </Text>
                      <TouchableOpacity
                        style={styles.copyButton}
                        onPress={() => {
                          Alert.alert('Address', selectedWallet?.address);
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="copy-outline" size={20} color={colors.primary} />
                        <Text style={styles.copyButtonText}>Copy Address</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>
              ) : walletAction === 'sendToken' ? (
                <ScrollView style={styles.walletActionScroll} showsVerticalScrollIndicator={false}>
                  {loadingTokens ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                  ) : tokens.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Ionicons name="diamond-outline" size={64} color={colors.textSecondary} />
                      <Text style={styles.emptyText}>No tokens found</Text>
                    </View>
                  ) : (
                    <View style={styles.tokenList}>
                      {tokens.map((token, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[styles.tokenItem, selectedToken?.symbol === token.symbol && styles.tokenItemSelected]}
                          onPress={() => setSelectedToken(token)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.tokenInfo}>
                            <Text style={styles.tokenSymbol}>{token.symbol || 'TOKEN'}</Text>
                            <Text style={styles.tokenName}>{token.name || 'Unknown Token'}</Text>
                            <Text style={styles.tokenBalance}>{token.balance || '0'}</Text>
                          </View>
                          {selectedToken?.symbol === token.symbol && (
                            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                          )}
                        </TouchableOpacity>
                      ))}
                      {selectedToken && (
                        <View style={styles.walletActionForm}>
                          <Text style={styles.walletActionLabel}>Recipient Address</Text>
                          <TextInput
                            style={styles.walletActionInput}
                            value={sendToAddress}
                            onChangeText={setSendToAddress}
                            placeholder="Enter recipient address"
                            placeholderTextColor={colors.textSecondary}
                            autoCapitalize="none"
                          />
                          <Text style={styles.walletActionLabel}>Amount</Text>
                          <TextInput
                            style={styles.walletActionInput}
                            value={sendAmount}
                            onChangeText={setSendAmount}
                            placeholder="0.00"
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="decimal-pad"
                          />
                          <TouchableOpacity
                            style={[styles.walletActionSubmitButton, sending && styles.walletActionSubmitButtonDisabled]}
                            onPress={handleSendPayment}
                            disabled={sending}
                            activeOpacity={0.8}
                          >
                            {sending ? (
                              <ActivityIndicator color="#fff" />
                            ) : (
                              <Text style={styles.walletActionSubmitText}>Send Token</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}
                </ScrollView>
              ) : walletAction === 'sendNFT' ? (
                <ScrollView style={styles.walletActionScroll} showsVerticalScrollIndicator={false}>
                  {loadingNfts ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                  ) : nfts.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Ionicons name="image-outline" size={64} color={colors.textSecondary} />
                      <Text style={styles.emptyText}>No NFTs found</Text>
                    </View>
                  ) : (
                    <View style={styles.nftList}>
                      {nfts.map((nft, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[styles.nftItem, selectedNFT?.id === nft.id && styles.nftItemSelected]}
                          onPress={() => setSelectedNFT(nft)}
                          activeOpacity={0.7}
                        >
                          {nft.image && (
                            <Image source={{ uri: nft.image }} style={styles.nftImage} />
                          )}
                          <View style={styles.nftInfo}>
                            <Text style={styles.nftName}>{nft.name || 'Unnamed NFT'}</Text>
                            <Text style={styles.nftDescription}>{nft.description || ''}</Text>
                          </View>
                          {selectedNFT?.id === nft.id && (
                            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                          )}
                        </TouchableOpacity>
                      ))}
                      {selectedNFT && (
                        <View style={styles.walletActionForm}>
                          <Text style={styles.walletActionLabel}>Recipient Address</Text>
                          <TextInput
                            style={styles.walletActionInput}
                            value={sendToAddress}
                            onChangeText={setSendToAddress}
                            placeholder="Enter recipient address"
                            placeholderTextColor={colors.textSecondary}
                            autoCapitalize="none"
                          />
                          <TouchableOpacity
                            style={[styles.walletActionSubmitButton, sending && styles.walletActionSubmitButtonDisabled]}
                            onPress={handleSendPayment}
                            disabled={sending}
                            activeOpacity={0.8}
                          >
                            {sending ? (
                              <ActivityIndicator color="#fff" />
                            ) : (
                              <Text style={styles.walletActionSubmitText}>Send NFT</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}
                </ScrollView>
              ) : null}

              {walletAction && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    setWalletAction(null);
                    setSendToAddress('');
                    setSendAmount('');
                    setSendMemo('');
                    setSelectedToken(null);
                    setSelectedNFT(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={20} color={colors.primary} />
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Add Wallet Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowAddModal(false);
          setPrivateKey('');
        }}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardView}
          >
            <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Wallet</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddModal(false);
                  setPrivateKey('');
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Enter your Solana private key (base58 encoded)
            </Text>

            <TextInput
              style={styles.modalInput}
              value={privateKey}
              onChangeText={setPrivateKey}
              placeholder="Private key..."
              placeholderTextColor={colors.textSecondary}
              multiline
              secureTextEntry
              autoCapitalize="none"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowAddModal(false);
                  setPrivateKey('');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonAdd, (!privateKey.trim() || addingWallet) && styles.modalButtonDisabled]}
                onPress={handleAddWallet}
                disabled={!privateKey.trim() || addingWallet}
                activeOpacity={0.7}
              >
                {addingWallet ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonAddText}>Add Wallet</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Business Manager Screen with Setup Wizard
function BusinessManagerScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [businessData, setBusinessData] = useState({
    business_name: '',
    employee_count: '',
    typical_hours: { open: '09:00', close: '17:00' },
    has_pos_api: null,
    pos_api_config: {
      provider: '',
      api_key: '',
      api_secret: '',
      endpoint: '',
    },
    business_type: '',
    business_address: '',
    business_phone: '',
    business_email: '',
    currency: 'USD',
    timezone: 'America/New_York',
  });
  const [loading, setLoading] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [existingBusiness, setExistingBusiness] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
    loadBusinessData();
  }, []);

  const loadBusinessData = async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const response = await axios.get(`${API_BASE_URL}/api/skills/business_manager/data`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (response.data.data && response.data.data.business_name !== 'My Business') {
        setExistingBusiness(response.data.data);
        setBusinessData({
          business_name: response.data.data.business_name || '',
          employee_count: response.data.data.employee_count?.toString() || '',
          typical_hours: response.data.data.typical_hours || { open: '09:00', close: '17:00' },
          has_pos_api: response.data.data.has_pos_api ?? null,
          pos_api_config: response.data.data.pos_api_config || {
            provider: '',
            api_key: '',
            api_secret: '',
            endpoint: '',
          },
          business_type: response.data.data.business_type || '',
          business_address: response.data.data.business_address || '',
          business_phone: response.data.data.business_phone || '',
          business_email: response.data.data.business_email || '',
          currency: response.data.data.settings?.currency || 'USD',
          timezone: response.data.data.settings?.timezone || 'America/New_York',
        });
      }
    } catch (error) {
      console.log('No existing business data');
    }
  };

  const saveBusinessData = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      await axios.post(
        `${API_BASE_URL}/api/skills/execute`,
        {
          skill_id: 'business_manager',
          task: 'setup business',
          parameters: {
            business_name: businessData.business_name,
            employee_count: parseInt(businessData.employee_count) || 0,
            typical_hours: businessData.typical_hours,
            has_pos_api: businessData.has_pos_api,
            pos_api_config: businessData.has_pos_api ? businessData.pos_api_config : null,
            business_type: businessData.business_type,
            business_address: businessData.business_address,
            business_phone: businessData.business_phone,
            business_email: businessData.business_email,
            currency: businessData.currency,
            timezone: businessData.timezone,
          }
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setSetupComplete(true);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || error.message);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      id: 'business_name',
      title: 'What is your business name?',
      type: 'text',
      placeholder: 'Enter your business name',
      value: businessData.business_name,
      onChange: (text) => setBusinessData({ ...businessData, business_name: text }),
    },
    {
      id: 'employee_count',
      title: 'How many employees do you have?',
      type: 'number',
      placeholder: 'Enter number of employees',
      value: businessData.employee_count,
      onChange: (text) => setBusinessData({ ...businessData, employee_count: text }),
    },
    {
      id: 'typical_hours',
      title: 'What are your typical business hours?',
      type: 'time_range',
      value: businessData.typical_hours,
      onChange: (hours) => setBusinessData({ ...businessData, typical_hours: hours }),
    },
    {
      id: 'has_pos_api',
      title: 'Does your POS system have an API?',
      type: 'yes_no',
      value: businessData.has_pos_api,
      onChange: (value) => setBusinessData({ ...businessData, has_pos_api: value }),
    },
    ...(businessData.has_pos_api === true ? [
      {
        id: 'pos_provider',
        title: 'What POS provider do you use?',
        type: 'select',
        options: ['Square', 'Clover', 'Toast', 'Shopify POS', 'Stripe Terminal', 'Other'],
        value: businessData.pos_api_config.provider,
        onChange: (value) => setBusinessData({
          ...businessData,
          pos_api_config: { ...businessData.pos_api_config, provider: value }
        }),
      },
      {
        id: 'pos_api_key',
        title: 'Enter your POS API Key',
        type: 'text',
        placeholder: 'API Key',
        value: businessData.pos_api_config.api_key,
        onChange: (text) => setBusinessData({
          ...businessData,
          pos_api_config: { ...businessData.pos_api_config, api_key: text }
        }),
      },
      {
        id: 'pos_api_secret',
        title: 'Enter your POS API Secret',
        type: 'text',
        placeholder: 'API Secret',
        secure: true,
        value: businessData.pos_api_config.api_secret,
        onChange: (text) => setBusinessData({
          ...businessData,
          pos_api_config: { ...businessData.pos_api_config, api_secret: text }
        }),
      },
      {
        id: 'pos_endpoint',
        title: 'Enter your POS API Endpoint (optional)',
        type: 'text',
        placeholder: 'https://api.example.com',
        value: businessData.pos_api_config.endpoint,
        onChange: (text) => setBusinessData({
          ...businessData,
          pos_api_config: { ...businessData.pos_api_config, endpoint: text }
        }),
      },
    ] : []),
    {
      id: 'business_type',
      title: 'What type of business do you run?',
      type: 'select',
      options: ['Retail', 'Restaurant', 'Service', 'E-commerce', 'Healthcare', 'Real Estate', 'Other'],
      value: businessData.business_type,
      onChange: (value) => setBusinessData({ ...businessData, business_type: value }),
    },
    {
      id: 'business_address',
      title: 'What is your business address?',
      type: 'text',
      placeholder: 'Enter business address',
      value: businessData.business_address,
      onChange: (text) => setBusinessData({ ...businessData, business_address: text }),
    },
    {
      id: 'business_phone',
      title: 'What is your business phone number?',
      type: 'phone',
      placeholder: '(555) 123-4567',
      value: businessData.business_phone,
      onChange: (text) => setBusinessData({ ...businessData, business_phone: text }),
    },
    {
      id: 'business_email',
      title: 'What is your business email?',
      type: 'email',
      placeholder: 'business@example.com',
      value: businessData.business_email,
      onChange: (text) => setBusinessData({ ...businessData, business_email: text }),
    },
    {
      id: 'currency',
      title: 'What currency do you use?',
      type: 'select',
      options: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'Other'],
      value: businessData.currency,
      onChange: (value) => setBusinessData({ ...businessData, currency: value }),
    },
    {
      id: 'timezone',
      title: 'What is your timezone?',
      type: 'select',
      options: [
        'America/New_York',
        'America/Chicago',
        'America/Denver',
        'America/Los_Angeles',
        'America/Phoenix',
        'Europe/London',
        'Europe/Paris',
        'Asia/Tokyo',
        'Asia/Shanghai',
        'Australia/Sydney',
      ],
      value: businessData.timezone,
      onChange: (value) => setBusinessData({ ...businessData, timezone: value }),
    },
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      saveBusinessData();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      saveBusinessData();
    }
  };

  const renderStepContent = () => {
    if (!currentStepData) return null;

    switch (currentStepData.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'number':
        return (
          <View style={styles.setupInputContainer}>
            <TextInput
              style={styles.setupInput}
              value={currentStepData.value}
              onChangeText={currentStepData.onChange}
              placeholder={currentStepData.placeholder}
              placeholderTextColor={colors.textSecondary}
              keyboardType={
                currentStepData.type === 'email' ? 'email-address' :
                currentStepData.type === 'phone' ? 'phone-pad' :
                currentStepData.type === 'number' ? 'numeric' : 'default'
              }
              secureTextEntry={currentStepData.secure}
              autoCapitalize={currentStepData.type === 'email' ? 'none' : 'words'}
            />
          </View>
        );

      case 'select':
        return (
          <View style={styles.setupOptionsContainer}>
            {currentStepData.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.setupOption,
                  currentStepData.value === option && styles.setupOptionSelected
                ]}
                onPress={() => currentStepData.onChange(option)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.setupOptionText,
                  currentStepData.value === option && styles.setupOptionTextSelected
                ]}>
                  {option}
                </Text>
                {currentStepData.value === option && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'yes_no':
        return (
          <View style={styles.setupYesNoContainer}>
            <TouchableOpacity
              style={[
                styles.setupYesNoButton,
                businessData.has_pos_api === true && styles.setupYesNoButtonSelected
              ]}
              onPress={() => currentStepData.onChange(true)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="checkmark-circle" 
                size={32} 
                color={businessData.has_pos_api === true ? '#fff' : colors.primary} 
              />
              <Text style={[
                styles.setupYesNoText,
                businessData.has_pos_api === true && styles.setupYesNoTextSelected
              ]}>
                Yes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.setupYesNoButton,
                businessData.has_pos_api === false && styles.setupYesNoButtonSelected
              ]}
              onPress={() => currentStepData.onChange(false)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="close-circle" 
                size={32} 
                color={businessData.has_pos_api === false ? '#fff' : colors.error} 
              />
              <Text style={[
                styles.setupYesNoText,
                businessData.has_pos_api === false && styles.setupYesNoTextSelected
              ]}>
                No
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'time_range':
        return (
          <View style={styles.setupTimeContainer}>
            <View style={styles.setupTimeRow}>
              <Text style={styles.setupTimeLabel}>Open Time</Text>
              <TextInput
                style={styles.setupTimeInput}
                value={businessData.typical_hours.open}
                onChangeText={(text) => setBusinessData({
                  ...businessData,
                  typical_hours: { ...businessData.typical_hours, open: text }
                })}
                placeholder="09:00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.setupTimeRow}>
              <Text style={styles.setupTimeLabel}>Close Time</Text>
              <TextInput
                style={styles.setupTimeInput}
                value={businessData.typical_hours.close}
                onChangeText={(text) => setBusinessData({
                  ...businessData,
                  typical_hours: { ...businessData.typical_hours, close: text }
                })}
                placeholder="17:00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  if (setupComplete) {
    return (
      <SafeAreaView style={styles.businessContainer} edges={['top']}>
        <StatusBar style="dark" />
        <View style={styles.setupCompleteContainer}>
          <View style={styles.setupCompleteIcon}>
            <Ionicons name="checkmark-circle" size={80} color={colors.success} />
          </View>
          <Text style={styles.setupCompleteTitle}>Setup Complete!</Text>
          <Text style={styles.setupCompleteText}>
            Your business has been configured successfully.
          </Text>
          <TouchableOpacity
            style={styles.setupCompleteButton}
            onPress={() => {
              setSetupComplete(false);
              setCurrentStep(0);
              loadBusinessData();
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.setupCompleteButtonText}>View Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.businessContainer} edges={['top']}>
      <StatusBar style="dark" />
      <Animated.View style={[styles.businessContent, { opacity: fadeAnim }]}>
        {existingBusiness && currentStep === 0 && (
          <View style={styles.existingBusinessBanner}>
            <Text style={styles.existingBusinessText}>
              You have an existing business setup. You can update it or start fresh.
            </Text>
          </View>
        )}

        <View style={styles.setupHeader}>
          <Text style={styles.setupTitle}>Business Setup</Text>
          <Text style={styles.setupSubtitle}>
            Step {currentStep + 1} of {steps.length}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        <ScrollView 
          style={styles.setupScroll}
          contentContainerStyle={styles.setupScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.setupStepCard}>
            <Text style={styles.setupStepTitle}>{currentStepData?.title}</Text>
            {renderStepContent()}
          </View>
        </ScrollView>

        <View style={styles.setupButtons}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={styles.setupButtonBack}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
              <Text style={styles.setupButtonBackText}>Back</Text>
            </TouchableOpacity>
          )}
          <View style={styles.setupButtonSpacer} />
          {currentStepData?.id !== 'business_name' && (
            <TouchableOpacity
              style={styles.setupButtonSkip}
              onPress={handleSkip}
              activeOpacity={0.7}
            >
              <Text style={styles.setupButtonSkipText}>Skip</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.setupButtonNext,
              loading && styles.setupButtonDisabled
            ]}
            onPress={handleNext}
            disabled={loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.setupButtonNextText}>
                  {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

// Video Screen with Library, Upload, and Generate tabs
function VideoScreen() {
  const [activeTab, setActiveTab] = useState('Library');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [styleReference, setStyleReference] = useState(''); // YouTube link or creator name
  const [editing, setEditing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
    if (activeTab === 'Library') {
      loadVideos();
    }
  }, [activeTab]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const response = await axios.get(`${API_BASE_URL}/api/videos`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setVideos(response.data.videos || []);
    } catch (error) {
      console.log('Error loading videos:', error.message);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadVideo(result.assets[0].uri);
    }
  };

  const uploadVideo = async (videoUri) => {
    setUploading(true);
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const formData = new FormData();
      formData.append('file', {
        uri: videoUri,
        type: 'video/mp4',
        name: 'video.mp4',
      });

      const headers = { 'Content-Type': 'multipart/form-data' };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      await axios.post(`${API_BASE_URL}/api/upload/video`, formData, {
        headers,
      });

      Alert.alert('Success', 'Video uploaded successfully!');
      loadVideos();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || error.message);
    } finally {
      setUploading(false);
    }
  };

  const generateVideo = async () => {
    if (!generatePrompt.trim() || generating) return;
    setGenerating(true);
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const response = await axios.post(
        `${API_BASE_URL}/api/video/generate`,
        {
          prompt: generatePrompt,
          duration: 5,
          fps: 24,
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      Alert.alert('Success', 'Video generated successfully!');
      setGeneratePrompt('');
      loadVideos();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || error.message);
    } finally {
      setGenerating(false);
    }
  };

  const editVideos = async () => {
    if (selectedVideos.length === 0 || !editPrompt.trim() || editing) return;
    setEditing(true);
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      
      // Build edit instruction with style reference if provided
      let instruction = editPrompt;
      if (styleReference.trim()) {
        instruction = `Edit in the style of: ${styleReference}. ${editPrompt}`;
      }

      // Process each selected video
      const promises = selectedVideos.map(video => 
        axios.post(
          `${API_BASE_URL}/api/video/edit`,
          {
            file_id: video.file_id,
            instruction: instruction,
          },
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        )
      );

      await Promise.all(promises);
      Alert.alert('Success', `${selectedVideos.length} video(s) edited successfully!`);
      setSelectedVideos([]);
      setEditPrompt('');
      setStyleReference('');
      loadVideos();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || error.message);
    } finally {
      setEditing(false);
    }
  };

  const toggleVideoSelection = (video) => {
    setSelectedVideos(prev => {
      const exists = prev.find(v => v.file_id === video.file_id);
      if (exists) {
        return prev.filter(v => v.file_id !== video.file_id);
      } else {
        return [...prev, video];
      }
    });
  };

  const renderLibraryTab = () => (
    <ScrollView 
      style={styles.videoScroll}
      contentContainerStyle={styles.videoContent}
      showsVerticalScrollIndicator={false}
    >
      {loading ? (
        <View style={styles.videoLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : videos.length === 0 ? (
        <View style={styles.videoEmpty}>
          <Ionicons name="videocam-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.videoEmptyText}>No videos yet</Text>
          <Text style={styles.videoEmptySubtext}>Upload or generate videos to see them here</Text>
        </View>
      ) : (
        <>
          {selectedVideos.length > 0 && (
            <View style={styles.videoSelectionBanner}>
              <Text style={styles.videoSelectionText}>
                {selectedVideos.length} video{selectedVideos.length !== 1 ? 's' : ''} selected
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedVideos([])}
                style={styles.videoSelectionClear}
              >
                <Text style={styles.videoSelectionClearText}>Clear</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.videoGrid}>
            {videos.map((video) => {
            const isSelected = selectedVideos.some(v => v.file_id === video.file_id);
            return (
              <TouchableOpacity
                key={video.file_id}
                style={[styles.videoCard, isSelected && styles.videoCardSelected]}
                onPress={() => toggleVideoSelection(video)}
                onLongPress={() => {
                  // Play video on long press
                  Alert.alert('Video', `Playing: ${video.file_id}`);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.videoThumbnail}>
                  <Ionicons name="videocam" size={32} color={colors.textSecondary} />
                  {isSelected && (
                    <View style={styles.videoSelectedBadge}>
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    </View>
                  )}
                </View>
                <Text style={styles.videoCardTitle} numberOfLines={1}>
                  {video.file_id}
                </Text>
                <Text style={styles.videoCardMeta}>
                  {video.duration ? `${video.duration}s` : ''} • {video.resolution || 'N/A'}
                </Text>
              </TouchableOpacity>
            );
          })}
          </View>
        </>
      )}
    </ScrollView>
  );

  const renderUploadTab = () => (
    <ScrollView 
      style={styles.videoScroll}
      contentContainerStyle={styles.videoContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.videoCard}>
        <View style={styles.videoCardHeader}>
          <View style={[styles.generateIconContainer, { backgroundColor: colors.purple + '20' }]}>
            <Ionicons name="cloud-upload" size={24} color={colors.purple} />
          </View>
          <Text style={styles.generateCardTitle}>Upload Video</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]} 
          onPress={pickVideo}
          disabled={uploading}
          activeOpacity={0.7}
        >
          {uploading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Ionicons name="videocam-outline" size={32} color={colors.primary} />
              <Text style={styles.uploadButtonText}>Pick Video from Gallery</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.videoHelpText}>
          Select a video from your device to add it to your library
        </Text>
      </View>
    </ScrollView>
  );

  const renderGenerateTab = () => (
    <ScrollView 
      style={styles.videoScroll}
      contentContainerStyle={styles.videoContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Generate New Video */}
      <View style={styles.videoCard}>
        <View style={styles.videoCardHeader}>
          <View style={[styles.generateIconContainer, { backgroundColor: colors.orange + '20' }]}>
            <Ionicons name="sparkles" size={24} color={colors.orange} />
          </View>
          <Text style={styles.generateCardTitle}>Generate Video</Text>
        </View>
        
        <TextInput
          style={styles.generateInput}
          value={generatePrompt}
          onChangeText={setGeneratePrompt}
          placeholder="Describe the video you want to create..."
          placeholderTextColor={colors.textSecondary}
          multiline
        />

        <TouchableOpacity
          style={[styles.generateButton, styles.videoButton, generating && styles.generateButtonDisabled]}
          onPress={generateVideo}
          disabled={generating || !generatePrompt.trim()}
          activeOpacity={0.8}
        >
          {generating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="play" size={20} color="#fff" />
              <Text style={styles.generateButtonText}>Generate</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Edit Selected Videos */}
      {selectedVideos.length > 0 && (
        <View style={styles.videoCard}>
          <View style={styles.videoCardHeader}>
            <View style={[styles.generateIconContainer, { backgroundColor: colors.pink + '20' }]}>
              <Ionicons name="create" size={24} color={colors.pink} />
            </View>
            <Text style={styles.generateCardTitle}>
              Edit {selectedVideos.length} Video{selectedVideos.length !== 1 ? 's' : ''}
            </Text>
          </View>

          <Text style={styles.videoHelpText}>
            Selected: {selectedVideos.length} video{selectedVideos.length !== 1 ? 's' : ''}
          </Text>

          <TextInput
            style={[styles.generateInput, styles.marginTop]}
            value={styleReference}
            onChangeText={setStyleReference}
            placeholder="Style reference (YouTube link or creator name)..."
            placeholderTextColor={colors.textSecondary}
          />

          <TextInput
            style={[styles.generateInput, styles.marginTop]}
            value={editPrompt}
            onChangeText={setEditPrompt}
            placeholder="Edit instruction (e.g., 'make it brighter', 'add slow motion')..."
            placeholderTextColor={colors.textSecondary}
            multiline
          />

          <TouchableOpacity
            style={[styles.generateButton, styles.editButton, editing && styles.generateButtonDisabled]}
            onPress={editVideos}
            disabled={editing || !editPrompt.trim()}
            activeOpacity={0.8}
          >
            {editing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="create" size={20} color="#fff" />
                <Text style={styles.generateButtonText}>
                  Edit {selectedVideos.length} Video{selectedVideos.length !== 1 ? 's' : ''}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modalButton, styles.modalButtonCancel, styles.marginTop]}
            onPress={() => setSelectedVideos([])}
            activeOpacity={0.7}
          >
            <Text style={styles.modalButtonCancelText}>Clear Selection</Text>
          </TouchableOpacity>
        </View>
      )}

      {selectedVideos.length === 0 && (
        <View style={styles.videoCard}>
          <View style={styles.videoCardHeader}>
            <Ionicons name="information-circle-outline" size={24} color={colors.textSecondary} />
            <Text style={styles.generateCardTitle}>How to Edit Videos</Text>
          </View>
          <Text style={styles.videoHelpText}>
            1. Go to the Library tab{'\n'}
            2. Select one or more videos{'\n'}
            3. Return to Generate tab to edit them{'\n'}
            4. Optionally provide a style reference (YouTube link or creator name){'\n'}
            5. Enter your edit instructions
          </Text>
        </View>
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.videoContainer} edges={['top']}>
      <StatusBar style="dark" />
      
      {/* Tab Selector */}
      <View style={styles.videoTabSelector}>
        <TouchableOpacity
          style={[styles.videoTab, activeTab === 'Library' && styles.videoTabActive]}
          onPress={() => setActiveTab('Library')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={activeTab === 'Library' ? 'library' : 'library-outline'} 
            size={20} 
            color={activeTab === 'Library' ? colors.primary : colors.textSecondary} 
          />
          <Text style={[styles.videoTabText, activeTab === 'Library' && styles.videoTabTextActive]}>
            Library
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.videoTab, activeTab === 'Upload' && styles.videoTabActive]}
          onPress={() => setActiveTab('Upload')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={activeTab === 'Upload' ? 'cloud-upload' : 'cloud-upload-outline'} 
            size={20} 
            color={activeTab === 'Upload' ? colors.primary : colors.textSecondary} 
          />
          <Text style={[styles.videoTabText, activeTab === 'Upload' && styles.videoTabTextActive]}>
            Upload
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.videoTab, activeTab === 'Generate' && styles.videoTabActive]}
          onPress={() => setActiveTab('Generate')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={activeTab === 'Generate' ? 'sparkles' : 'sparkles-outline'} 
            size={20} 
            color={activeTab === 'Generate' ? colors.primary : colors.textSecondary} 
          />
          <Text style={[styles.videoTabText, activeTab === 'Generate' && styles.videoTabTextActive]}>
            Generate
          </Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.videoContentContainer, { opacity: fadeAnim }]}>
        {activeTab === 'Library' && renderLibraryTab()}
        {activeTab === 'Upload' && renderUploadTab()}
        {activeTab === 'Generate' && renderGenerateTab()}
      </Animated.View>
    </SafeAreaView>
  );
}

// Media Screen
function MediaScreen() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [editInstruction, setEditInstruction] = useState('');
  const [editing, setEditing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const uploadAndEditImage = async () => {
    if (!selectedImage || !editInstruction.trim() || editing) return;
    setEditing(true);

    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const formData = new FormData();
      formData.append('file', {
        uri: selectedImage,
        type: 'image/jpeg',
        name: 'image.jpg',
      });

      const headers = { 'Content-Type': 'multipart/form-data' };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const uploadResponse = await axios.post(`${API_BASE_URL}/api/upload/image`, formData, {
        headers,
      });

      const editResponse = await axios.post(
        `${API_BASE_URL}/api/image/edit`,
        {
          file_id: uploadResponse.data.file_id,
          instruction: editInstruction,
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      Alert.alert('Success', 'Image edited!');
      setEditInstruction('');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || error.message);
    } finally {
      setEditing(false);
    }
  };

  return (
    <SafeAreaView style={styles.mediaContainer} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView 
        style={styles.mediaScroll}
        contentContainerStyle={styles.mediaContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.mediaCard}>
            <View style={styles.mediaCardHeader}>
              <View style={[styles.generateIconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="images" size={24} color={colors.primary} />
              </View>
              <Text style={styles.generateCardTitle}>Upload & Edit Image</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.uploadButton} 
              onPress={pickImage}
              activeOpacity={0.7}
            >
              <Ionicons name="image-outline" size={32} color={colors.primary} />
              <Text style={styles.uploadButtonText}>Pick Image from Gallery</Text>
        </TouchableOpacity>

        {selectedImage && (
          <Image source={{ uri: selectedImage }} style={styles.previewImage} />
        )}

        <TextInput
              style={[styles.generateInput, styles.marginTop]}
          value={editInstruction}
          onChangeText={setEditInstruction}
              placeholder="Edit instruction (e.g., 'make it brighter', 'add sunset')"
              placeholderTextColor={colors.textSecondary}
          multiline
        />

        <TouchableOpacity
              style={[
                styles.generateButton, 
                styles.editButton,
                (!selectedImage || !editInstruction.trim() || editing) && styles.generateButtonDisabled
              ]}
          onPress={uploadAndEditImage}
          disabled={!selectedImage || !editInstruction.trim() || editing}
              activeOpacity={0.8}
        >
          <Ionicons name="create" size={20} color="#fff" />
              <Text style={styles.generateButtonText}>
                {editing ? 'Editing...' : 'Edit Image'}
              </Text>
        </TouchableOpacity>
      </View>
        </Animated.View>
    </ScrollView>
    </SafeAreaView>
  );
}

// Main Tab Navigator
function MainTabs() {
  return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Chat') {
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
            } else if (route.name === 'Generate') {
              iconName = focused ? 'sparkles' : 'sparkles-outline';
            } else if (route.name === 'Media') {
              iconName = focused ? 'images' : 'images-outline';
            } else if (route.name === 'Video') {
              iconName = focused ? 'videocam' : 'videocam-outline';
            } else if (route.name === 'Wallets') {
              iconName = focused ? 'wallet' : 'wallet-outline';
            } else if (route.name === 'Business') {
              iconName = focused ? 'business' : 'business-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
          headerStyle: {
          backgroundColor: colors.card,
          borderBottomWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 17,
        },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0.5,
          borderTopColor: colors.border,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          height: Platform.OS === 'ios' ? 88 : 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{ title: 'Chat' }}
      />
      <Tab.Screen 
        name="Generate" 
        component={GenerateScreen}
        options={{ title: 'Generate' }}
      />
      <Tab.Screen 
        name="Media" 
        component={MediaScreen}
        options={{ title: 'Media' }}
      />
      <Tab.Screen 
        name="Video" 
        component={VideoScreen}
        options={{ title: 'Video' }}
      />
      <Tab.Screen 
        name="Wallets" 
        component={WalletsScreen}
        options={{ title: 'Wallets' }}
      />
      <Tab.Screen 
        name="Business" 
        component={BusinessManagerScreen}
        options={{ title: 'Business' }}
      />
      </Tab.Navigator>
  );
}

// Root Navigator
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        // Verify token is still valid
        try {
          const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.data.assistant) {
            setIsAuthenticated(true);
          } else {
            // User needs to select assistant
            setIsAuthenticated(false);
          }
        } catch (error) {
          // Token invalid, clear storage
          await AsyncStorage.multiRemove([TOKEN_KEY, USERNAME_KEY]);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="AssistantSelect" component={AssistantSelectScreen} />
          </>
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Beautiful iOS-style styles
const styles = StyleSheet.create({
  // Login/SignUp Styles
  loginContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loginContent: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  loginSubtitle: {
    fontSize: 17,
    color: colors.textSecondary,
  },
  loginForm: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: colors.text,
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: 4,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 56,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  signUpButton: {
    marginTop: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  signUpButtonText: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '600',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 1,
    padding: 8,
  },

  // Assistant Selection Styles
  assistantContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  assistantContent: {
    flex: 1,
  },
  assistantHeader: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  assistantTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  assistantSubtitle: {
    fontSize: 17,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  assistantScroll: {
    flex: 1,
  },
  assistantScrollContent: {
    padding: 16,
  },
  assistantCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  assistantCardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  assistantCardTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  assistantIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  assistantCardContent: {
    flex: 1,
  },
  assistantCardName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  assistantCardDescription: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  checkmarkContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Chat Styles
  chatContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  chatKeyboardView: {
    flex: 1,
  },
  chatContent: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  welcomeIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  welcomeSubtext: {
    fontSize: 17,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 8,
    maxWidth: '80%',
  },
  userMessage: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    backgroundColor: colors.card,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  },
  userMessageText: {
    color: '#fff',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textSecondary,
    marginRight: 4,
  },
  typingDotDelay1: {
    animationDelay: '0.2s',
  },
  typingDotDelay2: {
    animationDelay: '0.4s',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  inputWrapperChat: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.background,
    borderRadius: 24,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputChat: {
    flex: 1,
    fontSize: 17,
    color: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },

  // Generate Styles
  generateContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  generateScroll: {
    flex: 1,
  },
  generateContent: {
    padding: 16,
  },
  generateCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  generateCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  generateIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  generateCardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  generateInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 17,
    color: colors.text,
    minHeight: 56,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
  },
  marginTop: {
    marginTop: 12,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  imageButton: {
    backgroundColor: colors.pink,
  },
  videoButton: {
    backgroundColor: colors.purple,
  },
  songButton: {
    backgroundColor: colors.orange,
  },
  editButton: {
    backgroundColor: colors.primary,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 8,
  },
  generatedImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginTop: 16,
    resizeMode: 'contain',
    backgroundColor: colors.background,
  },

  // Media Styles
  mediaContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mediaScroll: {
    flex: 1,
  },
  mediaContent: {
    padding: 16,
  },
  mediaCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  mediaCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 12,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginTop: 16,
    resizeMode: 'cover',
    backgroundColor: colors.background,
  },

  // Wallets Styles
  walletsContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  walletsScroll: {
    flex: 1,
  },
  walletsContent: {
    padding: 16,
  },
  walletsLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  walletsEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  walletsEmptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  walletsEmptyText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  walletsEmptySubtext: {
    fontSize: 17,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  walletsHeader: {
    marginBottom: 16,
  },
  walletsTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  walletsSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  walletCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  walletCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  walletInfo: {
    flex: 1,
  },
  walletAddress: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  walletDate: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  expandButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 8,
  },
  generateWalletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
  },
  generateWalletButtonDisabled: {
    opacity: 0.6,
  },
  generateWalletButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalKeyboardView: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 17,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtonAdd: {
    backgroundColor: colors.primary,
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonCancelText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
  modalButtonAddText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  walletSection: {
    marginBottom: 32,
  },
  showTypesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  showTypesButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
  bitcoinTypesContainer: {
    marginTop: 8,
  },
  chainSection: {
    marginBottom: 20,
  },
  chainTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  bitcoinTypeCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bitcoinTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bitcoinTypeInfo: {
    flex: 1,
  },
  bitcoinTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  bitcoinTypeAddress: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  infoButton: {
    padding: 4,
  },
  tooltipContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  tooltipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  tooltipText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  walletTypeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  walletTypeLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },

  // Wallet Action Modal Styles
  walletModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  walletModalKeyboardView: {
    width: '100%',
  },
  walletModalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '90%',
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  walletModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  walletModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  walletModalCloseButton: {
    padding: 4,
  },
  walletActionButtons: {
    gap: 12,
  },
  walletActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  walletActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  walletActionText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  walletActionScroll: {
    maxHeight: 500,
  },
  walletActionForm: {
    marginTop: 16,
  },
  walletActionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  walletActionInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 17,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  walletActionTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  walletActionSubmitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  walletActionSubmitButtonDisabled: {
    opacity: 0.6,
  },
  walletActionSubmitText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  receiveContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  receiveLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 24,
  },
  qrCodeContainer: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  addressText: {
    fontSize: 13,
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  copyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
  loadingContainer: {
    paddingVertical: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 17,
    color: colors.textSecondary,
    marginTop: 16,
  },
  tokenList: {
    gap: 12,
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tokenItemSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenSymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  tokenName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  tokenBalance: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  nftList: {
    gap: 12,
  },
  nftItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nftItemSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  nftImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: colors.background,
  },
  nftInfo: {
    flex: 1,
  },
  nftName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  nftDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },

  // Business Manager Styles
  businessContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  businessContent: {
    flex: 1,
  },
  existingBusinessBanner: {
    backgroundColor: colors.warning + '20',
    padding: 12,
    margin: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  existingBusinessText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  setupHeader: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  setupTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  setupSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  setupScroll: {
    flex: 1,
  },
  setupScrollContent: {
    padding: 16,
  },
  setupStepCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  setupStepTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 24,
    lineHeight: 32,
  },
  setupInputContainer: {
    marginTop: 8,
  },
  setupInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 17,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 56,
  },
  setupOptionsContainer: {
    marginTop: 8,
  },
  setupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  setupOptionSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
    borderWidth: 2,
  },
  setupOptionText: {
    fontSize: 17,
    color: colors.text,
    fontWeight: '500',
  },
  setupOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  setupYesNoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
  setupYesNoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.border,
    gap: 8,
  },
  setupYesNoButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  setupYesNoText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  setupYesNoTextSelected: {
    color: '#fff',
  },
  setupTimeContainer: {
    marginTop: 8,
  },
  setupTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  setupTimeLabel: {
    fontSize: 17,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  setupTimeInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 17,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    width: 120,
    textAlign: 'center',
  },
  setupButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  setupButtonBack: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  setupButtonBackText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.primary,
  },
  setupButtonSpacer: {
    flex: 1,
  },
  setupButtonSkip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  setupButtonSkipText: {
    fontSize: 17,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  setupButtonNext: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
    minHeight: 50,
  },
  setupButtonDisabled: {
    opacity: 0.6,
  },
  setupButtonNextText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  setupCompleteContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  setupCompleteIcon: {
    marginBottom: 24,
  },
  setupCompleteTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  setupCompleteText: {
    fontSize: 17,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  setupCompleteButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    minWidth: 200,
  },
  setupCompleteButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Video Screen Styles
  videoContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  videoTabSelector: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  videoTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  videoTabActive: {
    backgroundColor: colors.primary + '15',
  },
  videoTabText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
    marginLeft: 6,
  },
  videoTabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  videoContentContainer: {
    flex: 1,
  },
  videoScroll: {
    flex: 1,
  },
  videoContent: {
    padding: 16,
  },
  videoLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  videoEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  videoEmptyText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  videoEmptySubtext: {
    fontSize: 17,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  videoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  videoCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  videoCardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primary + '10',
  },
  videoThumbnail: {
    width: '100%',
    height: 120,
    backgroundColor: colors.background,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  videoSelectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  videoCardMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  videoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  videoHelpText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginTop: 12,
  },
  videoButton: {
    backgroundColor: colors.orange,
  },
  videoSelectionBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  videoSelectionText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  videoSelectionClear: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  videoSelectionClearText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
});
