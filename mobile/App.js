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
  Dimensions,
  ActivityIndicator,
  Modal,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';

// Auto-detect API URL
const getApiUrl = () => {
  return __DEV__ ? 'http://localhost:8000' : 'http://YOUR_SERVER_IP:8000';
};

const API_BASE_URL = getApiUrl();
const { width, height } = Dimensions.get('window');

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

      // Store token
      // In a real app, use secure storage
      if (response.data.token) {
        // Navigate to main app
        navigation.replace('Main');
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
      // In a real app, get token from secure storage
      await axios.post(
        `${API_BASE_URL}/api/auth/select-assistant`,
        { assistant_id: assistant.id },
        { headers: { Authorization: 'Bearer YOUR_TOKEN' } }
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
      const response = await axios.post(`${API_BASE_URL}/api/chat`, {
        message: messageText,
        conversation_id: conversationId,
      });

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
      const response = await axios.post(`${API_BASE_URL}/api/image/generate`, {
        prompt: imagePrompt,
      });
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
      await axios.post(`${API_BASE_URL}/api/video/generate`, {
        prompt: videoPrompt,
      });
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
      const response = await axios.post(`${API_BASE_URL}/api/song/generate`, {
        prompt: songPrompt,
        for_fans_of: songForFansOf.trim() || undefined,
      });
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
      const formData = new FormData();
      formData.append('file', {
        uri: selectedImage,
        type: 'image/jpeg',
        name: 'image.jpg',
      });

      const uploadResponse = await axios.post(`${API_BASE_URL}/api/upload/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const editResponse = await axios.post(`${API_BASE_URL}/api/image/edit`, {
        file_id: uploadResponse.data.file_id,
        instruction: editInstruction,
      });

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
    </Tab.Navigator>
  );
}

// Root Navigator
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    // In a real app, check secure storage for token
    // For now, default to login screen
    setIsAuthenticated(false);
  }, []);

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
});
