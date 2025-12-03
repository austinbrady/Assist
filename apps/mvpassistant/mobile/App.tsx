import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, Text, ActivityIndicator } from 'react-native';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import ChatScreen from './src/screens/ChatScreen';
import SolutionsScreen from './src/screens/SolutionsScreen';
import AccountScreen from './src/screens/AccountScreen';

// Services
import { syncService } from './src/services/syncService';
import { deviceService } from './src/services/deviceService';
import { skillPredictor } from './src/services/skillPredictor';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator - 3 tabs: Account | Home | Solutions
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
      }}
    >
      <Tab.Screen 
        name="Account" 
        component={AccountScreen}
        options={{ 
          title: 'Account',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>👤</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Home" 
        component={ChatScreen}
        options={{ 
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>💬</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Solutions" 
        component={SolutionsScreen}
        options={{ 
          title: 'Solutions',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>💡</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Get device information
      const device = await deviceService.getDeviceInfo();
      setDeviceInfo(device);

      // Check authentication
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        // Verify token and get user info
        const userInfo = await syncService.verifyToken(token);
        if (userInfo) {
          setIsAuthenticated(true);
          setNeedsOnboarding(!userInfo.onboarding_complete);

          // Initialize device sync
          await syncService.initializeDevice(device, token);

          // Start proactive skill prediction
          skillPredictor.startPredicting(userInfo.profile, device);
        } else {
          await SecureStore.deleteItemAsync('auth_token');
        }
      }
    } catch (error) {
      console.error('Initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={{ marginTop: 16, color: '#6b7280' }}>Initializing MVP Assistant...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : needsOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

