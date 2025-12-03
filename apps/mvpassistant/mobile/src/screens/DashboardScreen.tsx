import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { syncService } from '../services/syncService';
import * as SecureStore from 'expo-secure-store';

export default function DashboardScreen() {
  const [skills, setSkills] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardConfig, setDashboardConfig] = useState<any>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;

      const data = await syncService.pullData(token);
      if (data) {
        setSkills(data.skills || []);
        setDashboardConfig(data.dashboardConfig);
      }
    } catch (error) {
      console.error('Load dashboard error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      await syncService.syncData(token);
      await loadDashboard();
    }
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Your Dashboard</Text>
        <Text style={styles.subtitle}>{skills.length} custom tools available</Text>
      </View>

      {skills.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No custom tools yet</Text>
          <Text style={styles.emptySubtext}>
            Complete onboarding to generate your personalized tools
          </Text>
        </View>
      ) : (
        <View style={styles.skillsContainer}>
          {skills.map((skill) => (
            <TouchableOpacity key={skill.skill_id} style={styles.skillCard}>
              <Text style={styles.skillIcon}>{skill.icon || '🔧'}</Text>
              <Text style={styles.skillName}>{skill.name}</Text>
              <Text style={styles.skillDescription}>{skill.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  skillsContainer: {
    padding: 16,
  },
  skillCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  skillIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  skillName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  skillDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
});

