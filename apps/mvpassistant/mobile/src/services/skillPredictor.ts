/**
 * Skill Predictor - Proactive skill generation
 * Analyzes user behavior and predicts needed skills before user asks
 */
import { deviceService, DeviceInfo } from './deviceService';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8000'
  : 'https://api.mvpassistant.com';

interface UserBehavior {
  actions: string[];
  patterns: string[];
  context: any;
  timestamp: string;
}

class SkillPredictor {
  private predictionInterval: NodeJS.Timeout | null = null;
  private behaviorHistory: UserBehavior[] = [];
  private isRunning = false;

  async startPredicting(userProfile: any, deviceInfo: DeviceInfo): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    // Collect behavior data every 5 minutes
    this.predictionInterval = setInterval(async () => {
      await this.collectBehavior(userProfile, deviceInfo);
      await this.analyzeAndPredict();
    }, 300000); // 5 minutes

    // Initial collection
    await this.collectBehavior(userProfile, deviceInfo);
  }

  stopPredicting(): void {
    if (this.predictionInterval) {
      clearInterval(this.predictionInterval);
      this.predictionInterval = null;
    }
    this.isRunning = false;
  }

  private async collectBehavior(userProfile: any, deviceInfo: DeviceInfo): Promise<void> {
    try {
      // Collect device usage patterns
      const batteryLevel = await deviceService.getBatteryLevel();
      const batteryState = await deviceService.getBatteryState();
      
      // Get recent activity
      const recentConversations = await this.getRecentConversations();
      const recentSkills = await this.getRecentSkills();

      const behavior: UserBehavior = {
        actions: [
          ...recentConversations.map(c => c.type || 'chat'),
          ...recentSkills.map(s => `skill:${s.skill_id}`),
        ],
        patterns: this.detectPatterns(recentConversations, recentSkills),
        context: {
          device: deviceInfo.platform,
          batteryLevel,
          batteryState,
          timeOfDay: new Date().getHours(),
          dayOfWeek: new Date().getDay(),
        },
        timestamp: new Date().toISOString(),
      };

      this.behaviorHistory.push(behavior);
      
      // Keep only last 100 behaviors
      if (this.behaviorHistory.length > 100) {
        this.behaviorHistory = this.behaviorHistory.slice(-100);
      }

      await AsyncStorage.setItem('behaviorHistory', JSON.stringify(this.behaviorHistory));
    } catch (error) {
      console.error('Behavior collection error:', error);
    }
  }

  private async analyzeAndPredict(): Promise<void> {
    if (this.behaviorHistory.length < 5) return; // Need some data first

    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;

      // Analyze patterns
      const patterns = this.identifyPatterns();
      const predictedNeeds = this.predictNeeds(patterns);

      // Check if we need to generate new skills
      for (const need of predictedNeeds) {
        await this.checkAndGenerateSkill(need, token);
      }
    } catch (error) {
      console.error('Prediction analysis error:', error);
    }
  }

  private identifyPatterns(): string[] {
    const patterns: string[] = [];
    const actionCounts = new Map<string, number>();

    // Count action frequencies
    for (const behavior of this.behaviorHistory) {
      for (const action of behavior.actions) {
        actionCounts.set(action, (actionCounts.get(action) || 0) + 1);
      }
    }

    // Identify frequent patterns
    for (const [action, count] of actionCounts.entries()) {
      if (count > 5) { // Action repeated more than 5 times
        patterns.push(action);
      }
    }

    return patterns;
  }

  private predictNeeds(patterns: string[]): string[] {
    const needs: string[] = [];

    // Pattern-based predictions
    if (patterns.some(p => p.includes('calendar') || p.includes('schedule'))) {
      needs.push('calendar_automation');
    }

    if (patterns.some(p => p.includes('contact') || p.includes('client'))) {
      needs.push('contact_management');
    }

    if (patterns.some(p => p.includes('task') || p.includes('todo'))) {
      needs.push('task_automation');
    }

    if (patterns.some(p => p.includes('email') || p.includes('message'))) {
      needs.push('communication_automation');
    }

    // Time-based predictions
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 17) {
      // Work hours - predict work-related skills
      needs.push('productivity_tools');
    }

    return needs;
  }

  private async checkAndGenerateSkill(need: string, token: string): Promise<void> {
    try {
      // Check if skill already exists
      const existingSkills = await this.getUserSkills(token);
      const skillExists = existingSkills.some(
        s => s.skill_id === need || s.name.toLowerCase().includes(need)
      );

      if (skillExists) return;

      // Request skill generation
      await axios.post(
        `${API_BASE_URL}/api/skills/predict`,
        {
          predictedNeed: need,
          behaviorHistory: this.behaviorHistory.slice(-20), // Last 20 behaviors
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (error) {
      console.error('Skill generation error:', error);
    }
  }

  private async getRecentConversations(): Promise<any[]> {
    try {
      const conversations = JSON.parse(
        (await AsyncStorage.getItem('conversations')) || '[]'
      );
      return conversations.slice(-10); // Last 10
    } catch {
      return [];
    }
  }

  private async getRecentSkills(): Promise<any[]> {
    try {
      const skills = JSON.parse(
        (await AsyncStorage.getItem('skills')) || '[]'
      );
      return skills.slice(-10); // Last 10
    } catch {
      return [];
    }
  }

  private async getUserSkills(token: string): Promise<any[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/skills`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.skills || [];
    } catch {
      return [];
    }
  }

  private detectPatterns(conversations: any[], skills: any[]): string[] {
    const patterns: string[] = [];

    // Detect time patterns
    const hours = conversations.map(c => new Date(c.timestamp).getHours());
    const avgHour = hours.reduce((a, b) => a + b, 0) / hours.length;
    if (avgHour >= 9 && avgHour <= 17) {
      patterns.push('work_hours');
    }

    // Detect skill usage patterns
    const skillIds = skills.map(s => s.skill_id);
    const uniqueSkills = new Set(skillIds);
    if (uniqueSkills.size > 3) {
      patterns.push('multi_skill_user');
    }

    return patterns;
  }
}

export const skillPredictor = new SkillPredictor();

