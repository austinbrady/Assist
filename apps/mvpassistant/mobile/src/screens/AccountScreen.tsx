import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const API_BASE_URL = __DEV__ ? 'http://localhost:8000' : 'https://api.mvpassistant.com';

interface User {
  username: string;
  first_name: string;
  last_name: string;
  gender: string;
  mvp_character_name: string;
  wallet_addresses?: Record<string, { address: string; network: string }>;
}

export default function AccountScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;

      const response = await axios.get(
        `${API_BASE_URL}/api/auth/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUser(response.data);
    } catch (error) {
      console.error('Load user data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await SecureStore.deleteItemAsync('auth_token');
            // App will detect logout and show login screen
            // Force app reload by restarting
            if (Platform.OS !== 'web') {
              // On native, the app will detect the token removal on next check
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account</Text>
      </View>

      <View style={styles.content}>
        {/* User Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Profile</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>
              {user?.first_name} {user?.last_name}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Username</Text>
            <Text style={styles.infoValue}>{user?.username}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Gender</Text>
            <Text style={styles.infoValue}>{user?.gender || 'Not set'}</Text>
          </View>

          {user?.mvp_character_name && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Assistant Name</Text>
              <Text style={styles.infoValue}>{user.mvp_character_name}</Text>
            </View>
          )}
        </View>

        {/* Wallets Card */}
        {user?.wallet_addresses && Object.keys(user.wallet_addresses).length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Crypto Wallets</Text>
            {Object.entries(user.wallet_addresses).map(([crypto, wallet]) => (
              <View key={crypto} style={styles.walletRow}>
                <Text style={styles.walletLabel}>{crypto.toUpperCase()}</Text>
                <Text style={styles.walletAddress} numberOfLines={1}>
                  {wallet.address}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  walletRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  walletLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  walletAddress: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'monospace',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 20,
  },
});

