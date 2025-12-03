/**
 * Device Service - Full device access and capabilities
 * Provides access to all device features and sensors
 */
import * as Device from 'expo-device';
import * as Contacts from 'expo-contacts';
import * as Calendar from 'expo-calendar';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as Camera from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Battery from 'expo-battery';
import { Accelerometer, Gyroscope, Magnetometer } from 'expo-sensors';
import { Platform } from 'react-native';

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  platform: string;
  osVersion: string;
  modelName: string;
  brand: string;
  totalMemory: number;
  cpuArchitecture: string;
  capabilities: DeviceCapabilities;
}

export interface DeviceCapabilities {
  hasCamera: boolean;
  hasLocation: boolean;
  hasContacts: boolean;
  hasCalendar: boolean;
  hasNotifications: boolean;
  hasSensors: boolean;
  hasBluetooth: boolean;
  hasNFC: boolean;
  hasBiometric: boolean;
  performanceTier: 'high' | 'medium' | 'low';
}

class DeviceService {
  private deviceId: string | null = null;
  private capabilities: DeviceCapabilities | null = null;

  async getDeviceInfo(): Promise<DeviceInfo> {
    const deviceId = await this.getDeviceId();
    const capabilities = await this.detectCapabilities();

    return {
      deviceId,
      deviceName: Device.deviceName || 'Unknown Device',
      platform: Platform.OS,
      osVersion: Platform.Version.toString(),
      modelName: Device.modelName || 'Unknown',
      brand: Device.brand || 'Unknown',
      totalMemory: Device.totalMemory || 0,
      cpuArchitecture: Device.supportedCpuArchitectures?.[0] || 'unknown',
      capabilities,
    };
  }

  private async getDeviceId(): Promise<string> {
    if (this.deviceId) return this.deviceId;

    // Try to get a persistent device ID
    try {
      const id = await Device.getDeviceTypeAsync();
      this.deviceId = `${Platform.OS}-${Device.modelId || 'unknown'}-${Date.now()}`;
      return this.deviceId;
    } catch {
      this.deviceId = `device-${Date.now()}-${Math.random()}`;
      return this.deviceId;
    }
  }

  async detectCapabilities(): Promise<DeviceCapabilities> {
    if (this.capabilities) return this.capabilities;

    const capabilities: DeviceCapabilities = {
      hasCamera: await this.checkCamera(),
      hasLocation: await this.checkLocation(),
      hasContacts: await this.checkContacts(),
      hasCalendar: await this.checkCalendar(),
      hasNotifications: await this.checkNotifications(),
      hasSensors: await this.checkSensors(),
      hasBluetooth: false, // Would need additional native module
      hasNFC: false, // Would need additional native module
      hasBiometric: false, // Would need additional native module
      performanceTier: this.detectPerformanceTier(),
    };

    this.capabilities = capabilities;
    return capabilities;
  }

  private async checkCamera(): Promise<boolean> {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }

  private async checkLocation(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }

  private async checkContacts(): Promise<boolean> {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }

  private async checkCalendar(): Promise<boolean> {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }

  private async checkNotifications(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }

  private async checkSensors(): Promise<boolean> {
    try {
      return Accelerometer.isAvailableAsync() || 
             Gyroscope.isAvailableAsync() || 
             Magnetometer.isAvailableAsync();
    } catch {
      return false;
    }
  }

  private detectPerformanceTier(): 'high' | 'medium' | 'low' {
    const totalMemory = Device.totalMemory || 0;
    const isTablet = Device.deviceType === Device.DeviceType.TABLET;

    // High performance: Latest devices with high memory
    if (totalMemory > 6000000000 || (isTablet && totalMemory > 4000000000)) {
      return 'high';
    }

    // Medium performance: Mid-range devices
    if (totalMemory > 3000000000) {
      return 'medium';
    }

    // Low performance: Older devices
    return 'low';
  }

  // Device data access methods
  async getContacts(): Promise<Contacts.Contact[]> {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Contacts permission not granted');
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.Name,
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Emails,
        Contacts.Fields.Addresses,
      ],
    });

    return data;
  }

  async getCalendarEvents(startDate: Date, endDate: Date): Promise<Calendar.Event[]> {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Calendar permission not granted');
    }

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const events: Calendar.Event[] = [];

    for (const calendar of calendars) {
      const calendarEvents = await Calendar.getEventsAsync(
        [calendar.id],
        startDate,
        endDate
      );
      events.push(...calendarEvents);
    }

    return events;
  }

  async getCurrentLocation(): Promise<Location.LocationObject> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission not granted');
    }

    return await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
  }

  async getBatteryLevel(): Promise<number> {
    const batteryLevel = await Battery.getBatteryLevelAsync();
    return batteryLevel;
  }

  async getBatteryState(): Promise<Battery.BatteryState> {
    return await Battery.getBatteryStateAsync();
  }

  // Sensor subscriptions
  subscribeToAccelerometer(callback: (data: { x: number; y: number; z: number }) => void) {
    Accelerometer.setUpdateInterval(100);
    return Accelerometer.addListener(callback);
  }

  subscribeToGyroscope(callback: (data: { x: number; y: number; z: number }) => void) {
    Gyroscope.setUpdateInterval(100);
    return Gyroscope.addListener(callback);
  }

  subscribeToMagnetometer(callback: (data: { x: number; y: number; z: number }) => void) {
    Magnetometer.setUpdateInterval(100);
    return Magnetometer.addListener(callback);
  }
}

export const deviceService = new DeviceService();

