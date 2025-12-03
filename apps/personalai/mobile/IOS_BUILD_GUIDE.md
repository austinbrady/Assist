# iOS Build Guide for Jailbreak AI

## Prerequisites

1. **Xcode** (latest version recommended)
2. **CocoaPods** installed: `sudo gem install cocoapods`
3. **Node.js** and **npm** installed
4. **Expo CLI** (optional, but helpful): `npm install -g expo-cli`

## Building for iPhone

### Option 1: Using Xcode (Recommended)

1. **Install Dependencies:**
   ```bash
   cd mobile
   npm install
   cd ios
   pod install
   cd ..
   ```

2. **Open in Xcode:**
   ```bash
   open ios/JailbreakAI.xcworkspace
   ```
   ⚠️ **Important:** Always open `.xcworkspace`, NOT `.xcodeproj`

3. **Configure Signing:**
   - Select the `JailbreakAI` project in the navigator
   - Go to "Signing & Capabilities" tab
   - Select your development team
   - Xcode will automatically manage provisioning profiles

4. **Select Target Device:**
   - Choose your iPhone from the device dropdown (top toolbar)
   - Or select a simulator (iPhone 14, iPhone 15, etc.)

5. **Build and Run:**
   - Press `Cmd + R` or click the Play button
   - First build may take several minutes

### Option 2: Using Command Line

```bash
cd mobile
npm install
cd ios
pod install
cd ..
npx expo run:ios
```

## Configuration

### API URL for Physical Device

If running on a **physical iPhone** (not simulator), you need to update the API URL:

1. Find your Mac's local IP address:
   ```bash
   ipconfig getifaddr en0
   # or
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. Update `mobile/App.js`:
   ```javascript
   const getApiUrl = () => {
     if (__DEV__) {
       // Replace with your Mac's IP address for physical device testing
       return 'http://192.168.1.XXX:8000'; // Your Mac's IP
       // Or use localhost for simulator
       // return 'http://localhost:8000';
     }
     return 'http://YOUR_SERVER_IP:8000';
   };
   ```

3. **Important:** Make sure your Mac and iPhone are on the **same Wi-Fi network**

### Backend Server

Ensure the backend is running:
```bash
cd backend
source venv/bin/activate
python main.py
```

The backend should be accessible at `http://localhost:8000` (simulator) or `http://YOUR_MAC_IP:8000` (physical device).

## Troubleshooting

### Build Errors

1. **"No such module" errors:**
   ```bash
   cd mobile/ios
   pod deintegrate
   pod install
   ```

2. **CocoaPods issues:**
   ```bash
   sudo gem install cocoapods
   pod repo update
   ```

3. **Clean build:**
   - In Xcode: `Product > Clean Build Folder` (Shift + Cmd + K)
   - Delete `DerivedData` folder if needed

### Network Issues

- **Simulator:** Use `localhost:8000`
- **Physical Device:** Use your Mac's IP address (e.g., `192.168.1.100:8000`)
- Ensure firewall allows connections on port 8000
- Check that both devices are on the same network

### Permission Issues

All required permissions are configured in `Info.plist`:
- Camera access
- Photo library access
- Microphone access

If permissions don't appear, check `Info.plist` has the correct usage descriptions.

## App Configuration

- **Bundle Identifier:** `com.jailbreakai.app`
- **Display Name:** Jailbreak AI
- **Version:** 1.0.0
- **Minimum iOS Version:** 13.0

## Testing Checklist

- [ ] App launches without crashes
- [ ] Login/Signup works
- [ ] Chat functionality works
- [ ] Image picker works (camera and photo library)
- [ ] All tabs navigate correctly
- [ ] Skills dashboard loads
- [ ] API connections work (check backend is running)
- [ ] No console errors in Xcode

## Production Build

For App Store submission:

1. Update version in `app.json` and `Info.plist`
2. Configure App Store Connect
3. Archive in Xcode: `Product > Archive`
4. Upload to App Store Connect
5. Submit for review

## Notes

- The app uses Expo SDK 49
- React Native 0.72.6
- Supports iOS 13.0+
- Portrait orientation (iPad supports all orientations)

