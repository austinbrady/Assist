/**
 * Sync Service - Cross-device synchronization
 * Handles account management and data sync across all user devices
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { DeviceInfo } from './deviceService';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8000'
  : 'https://api.mvpassistant.com'; // Production URL

export interface SyncData {
  conversations: any[];
  skills: any[];
  profile: any;
  dashboardConfig: any;
  deviceData: any;
  lastSync: string;
}

class SyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;

  async verifyToken(token: string): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async initializeDevice(deviceInfo: DeviceInfo, token: string): Promise<void> {
    try {
      await axios.post(
        `${API_BASE_URL}/api/devices/register`,
        {
          deviceId: deviceInfo.deviceId,
          deviceName: deviceInfo.deviceName,
          platform: deviceInfo.platform,
          osVersion: deviceInfo.osVersion,
          modelName: deviceInfo.modelName,
          capabilities: deviceInfo.capabilities,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Start periodic sync
      this.startPeriodicSync(token);
    } catch (error) {
      console.error('Device registration error:', error);
    }
  }

  async syncData(token: string): Promise<SyncData | null> {
    if (this.isSyncing) return null;
    this.isSyncing = true;

    try {
      // Get local data
      const localData = await this.getLocalData();

      // Sync with server
      const response = await axios.post(
        `${API_BASE_URL}/api/sync`,
        {
          localData,
          timestamp: new Date().toISOString(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const serverData = response.data;

      // Merge and save
      const mergedData = this.mergeData(localData, serverData);
      await this.saveLocalData(mergedData);

      this.isSyncing = false;
      return mergedData;
    } catch (error) {
      console.error('Sync error:', error);
      this.isSyncing = false;
      return null;
    }
  }

  async pushData(token: string, data: Partial<SyncData>): Promise<void> {
    try {
      await axios.post(
        `${API_BASE_URL}/api/sync/push`,
        {
          data,
          timestamp: new Date().toISOString(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (error) {
      console.error('Push data error:', error);
    }
  }

  async pullData(token: string): Promise<SyncData | null> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/sync/pull`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error('Pull data error:', error);
      return null;
    }
  }

  private async getLocalData(): Promise<SyncData> {
    try {
      const conversations = JSON.parse(
        (await AsyncStorage.getItem('conversations')) || '[]'
      );
      const skills = JSON.parse(
        (await AsyncStorage.getItem('skills')) || '[]'
      );
      const profile = JSON.parse(
        (await AsyncStorage.getItem('profile')) || '{}'
      );
      const dashboardConfig = JSON.parse(
        (await AsyncStorage.getItem('dashboardConfig')) || '{}'
      );
      const deviceData = JSON.parse(
        (await AsyncStorage.getItem('deviceData')) || '{}'
      );
      const lastSync = (await AsyncStorage.getItem('lastSync')) || '';

      return {
        conversations,
        skills,
        profile,
        dashboardConfig,
        deviceData,
        lastSync,
      };
    } catch (error) {
      return {
        conversations: [],
        skills: [],
        profile: {},
        dashboardConfig: {},
        deviceData: {},
        lastSync: '',
      };
    }
  }

  private async saveLocalData(data: SyncData): Promise<void> {
    await AsyncStorage.setItem('conversations', JSON.stringify(data.conversations));
    await AsyncStorage.setItem('skills', JSON.stringify(data.skills));
    await AsyncStorage.setItem('profile', JSON.stringify(data.profile));
    await AsyncStorage.setItem('dashboardConfig', JSON.stringify(data.dashboardConfig));
    await AsyncStorage.setItem('deviceData', JSON.stringify(data.deviceData));
    await AsyncStorage.setItem('lastSync', new Date().toISOString());
  }

  private mergeData(local: SyncData, server: SyncData): SyncData {
    // Merge conversations (keep most recent)
    const conversations = this.mergeByTimestamp(local.conversations, server.conversations);

    // Merge skills (server takes precedence for generated skills)
    const skills = server.skills.length > 0 ? server.skills : local.skills;

    // Server profile takes precedence
    const profile = server.profile || local.profile;

    // Server dashboard config takes precedence
    const dashboardConfig = server.dashboardConfig || local.dashboardConfig;

    // Merge device data
    const deviceData = { ...local.deviceData, ...server.deviceData };

    return {
      conversations,
      skills,
      profile,
      dashboardConfig,
      deviceData,
      lastSync: new Date().toISOString(),
    };
  }

  private mergeByTimestamp(local: any[], server: any[]): any[] {
    const merged = [...local];
    const serverMap = new Map(server.map(item => [item.id, item]));

    for (const serverItem of server) {
      const localItem = merged.find(item => item.id === serverItem.id);
      if (!localItem) {
        merged.push(serverItem);
      } else {
        const localTime = new Date(localItem.updated_at || 0).getTime();
        const serverTime = new Date(serverItem.updated_at || 0).getTime();
        if (serverTime > localTime) {
          const index = merged.indexOf(localItem);
          merged[index] = serverItem;
        }
      }
    }

    return merged.sort((a, b) => {
      const timeA = new Date(a.updated_at || 0).getTime();
      const timeB = new Date(b.updated_at || 0).getTime();
      return timeB - timeA;
    });
  }

  startPeriodicSync(token: string, interval: number = 30000): void {
    // Sync every 30 seconds
    this.syncInterval = setInterval(() => {
      this.syncData(token);
    }, interval);
  }

  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

export const syncService = new SyncService();

