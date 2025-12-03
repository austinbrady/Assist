import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = __DEV__ ? 'http://localhost:8000' : 'https://api.mvpassistant.com';

interface Solution {
  solution_id: string;
  problem: string;
  type: 'app' | 'script';
  created_at: string;
  features?: string[];
  has_gui?: boolean;
  has_exports?: boolean;
  has_tracking?: boolean;
}

export default function SolutionsScreen() {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadSolutions();
  }, []);

  const loadSolutions = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;

      const response = await axios.get(
        `${API_BASE_URL}/api/solutions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSolutions(response.data.solutions || []);
      setHasMore((response.data.solutions || []).length > 0);
    } catch (error) {
      console.error('Load solutions error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    loadSolutions(true);
  }, []);

  const formatDate = (dateString: string) => {
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
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getSolutionIcon = (type: string) => {
    return type === 'app' ? '📱' : '📜';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Solutions For You</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading solutions...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Solutions For You</Text>
        <Text style={styles.headerSubtitle}>
          {solutions.length} {solutions.length === 1 ? 'solution' : 'solutions'} created
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={(event) => {
          const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
          const paddingToBottom = 20;
          if (
            layoutMeasurement.height + contentOffset.y >=
            contentSize.height - paddingToBottom
          ) {
            // Load more if available (for future pagination)
            if (hasMore && !loadingMore) {
              // Future: implement pagination
            }
          }
        }}
        scrollEventThrottle={400}
      >
        {solutions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💡</Text>
            <Text style={styles.emptyText}>No solutions yet</Text>
            <Text style={styles.emptySubtext}>
              Start chatting with your assistant to build solutions!
            </Text>
          </View>
        ) : (
          <View style={styles.solutionsList}>
            {solutions.map((solution) => (
              <TouchableOpacity
                key={solution.solution_id}
                style={styles.solutionCard}
                activeOpacity={0.7}
              >
                <View style={styles.solutionHeader}>
                  <Text style={styles.solutionIcon}>
                    {getSolutionIcon(solution.type)}
                  </Text>
                  <View style={styles.solutionInfo}>
                    <Text style={styles.solutionType}>
                      {solution.type === 'app' ? 'Application' : 'Script'}
                    </Text>
                    <Text style={styles.solutionDate}>
                      {formatDate(solution.created_at)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.solutionProblem} numberOfLines={2}>
                  {solution.problem}
                </Text>

                {solution.features && solution.features.length > 0 && (
                  <View style={styles.featuresContainer}>
                    {solution.features.slice(0, 3).map((feature, idx) => (
                      <View key={idx} style={styles.featureTag}>
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                    {solution.features.length > 3 && (
                      <Text style={styles.moreFeatures}>
                        +{solution.features.length - 3} more
                      </Text>
                    )}
                  </View>
                )}

                <View style={styles.solutionBadges}>
                  {solution.has_gui && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>GUI</Text>
                    </View>
                  )}
                  {solution.has_exports && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>Exports</Text>
                    </View>
                  )}
                  {solution.has_tracking && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>Tracking</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {loadingMore && (
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" color="#6366f1" />
          </View>
        )}
      </ScrollView>
    </View>
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
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  solutionsList: {
    gap: 12,
  },
  solutionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  solutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  solutionIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  solutionInfo: {
    flex: 1,
  },
  solutionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  solutionDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  solutionProblem: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
    lineHeight: 20,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  featureTag: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featureText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
  },
  moreFeatures: {
    fontSize: 12,
    color: '#6b7280',
    alignSelf: 'center',
  },
  solutionBadges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  badge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  loadingMore: {
    padding: 20,
    alignItems: 'center',
  },
});

