import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { syncService } from '../services/syncService';
import * as SecureStore from 'expo-secure-store';

export default function SkillsScreen() {
  const [skills, setSkills] = useState<any[]>([]);

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;

      const data = await syncService.pullData(token);
      if (data) {
        setSkills(data.skills || []);
      }
    } catch (error) {
      console.error('Load skills error:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Custom Tools</Text>
        <Text style={styles.subtitle}>
          Tools generated specifically for you
        </Text>
      </View>

      {skills.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No tools yet</Text>
        </View>
      ) : (
        <View style={styles.skillsList}>
          {skills.map((skill) => (
            <TouchableOpacity key={skill.skill_id} style={styles.skillItem}>
              <Text style={styles.skillIcon}>{skill.icon || '🔧'}</Text>
              <View style={styles.skillInfo}>
                <Text style={styles.skillName}>{skill.name}</Text>
                <Text style={styles.skillDescription}>{skill.description}</Text>
                {skill.features && skill.features.length > 0 && (
                  <View style={styles.featuresContainer}>
                    {skill.features.slice(0, 3).map((feature: string, idx: number) => (
                      <View key={idx} style={styles.featureTag}>
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
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
    color: '#6b7280',
  },
  skillsList: {
    padding: 16,
  },
  skillItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  skillIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  skillInfo: {
    flex: 1,
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
    marginBottom: 8,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureTag: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featureText: {
    fontSize: 12,
    color: '#6366f1',
  },
});

