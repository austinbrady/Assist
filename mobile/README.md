# Jailbreak AI - Mobile App

React Native mobile application for Jailbreak AI, built with Expo.

## Prerequisites

- Node.js 16+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- For iOS: Xcode (macOS only)
- For Android: Android Studio

## Installation

1. **Navigate to mobile directory:**
   ```bash
   cd mobile
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure API URL:**
   
   **Option 1 - Automatic (Recommended):**
   ```bash
   node configure-ip.js YOUR_IP_ADDRESS
   # Example: node configure-ip.js 192.168.1.14
   ```
   
   **Option 2 - Manual:**
   - Open `App.js`
   - Find the `getApiUrl()` function
   - Replace `'http://localhost:8000'` with your computer's IP address
   - Example: `'http://192.168.1.14:8000'`

## Running the App

### Development

1. **Start the backend server** (from the main JailbreakAI directory):
   ```bash
   ./JailbreakAI.app
   ```

2. **Start Expo:**
   ```bash
   npm start
   ```

3. **Run on device:**
   - **iOS**: Press `i` in the terminal or scan QR code with Camera app
   - **Android**: Press `a` in the terminal or scan QR code with Expo Go app
   - **Web**: Press `w` in the terminal

### Using Expo Go App

1. Install **Expo Go** from App Store (iOS) or Google Play (Android)
2. Run `npm start`
3. Scan the QR code with:
   - **iOS**: Camera app
   - **Android**: Expo Go app

### Building for Production

**iOS:**
```bash
expo build:ios
```

**Android:**
```bash
expo build:android
```

## Features

- **Chat**: AI conversations
- **Generate**: Create images, videos, and songs
- **Media**: Upload and edit images

## Network Configuration

The app needs to connect to your backend server. Make sure:

1. Your computer and phone are on the same Wi-Fi network
2. The backend is running on port 8000
3. Your firewall allows connections on port 8000
4. The API URL in `App.js` matches your computer's IP address

## Troubleshooting

### Can't Connect to Backend
- Check that backend is running: `curl http://YOUR_IP:8000/health`
- Verify IP address in `App.js`
- Ensure both devices are on same network
- Check firewall settings

### Expo Go Not Working
- Make sure Expo CLI is installed: `npm install -g expo-cli`
- Try clearing cache: `expo start -c`
- Restart Expo: `npm start`

### Build Errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear Expo cache: `expo start -c`

## Notes

- The app connects to the same backend as the web version
- All processing happens on your server
- No data is sent to external services
- Works on iOS, Android, and Web

