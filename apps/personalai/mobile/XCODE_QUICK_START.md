# Xcode Quick Start Guide

## ✅ Project is Ready!

The Xcode workspace should now be open. Follow these steps:

## 1. Configure Signing (Required)

1. In Xcode, select the **JailbreakAI** project in the left navigator
2. Select the **JailbreakAI** target
3. Go to **Signing & Capabilities** tab
4. Check **"Automatically manage signing"**
5. Select your **Team** from the dropdown
6. Xcode will automatically create a provisioning profile

## 2. Select Target Device

- **For Simulator:** Choose any iPhone simulator (iPhone 14, iPhone 15, etc.)
- **For Physical iPhone:** 
  - Connect your iPhone via USB
  - Trust the computer on your iPhone if prompted
  - Select your iPhone from the device dropdown

## 3. API URL Configuration

### For iOS Simulator:
✅ Already configured - uses `localhost:8000`

### For Physical iPhone:
You need to update the API URL in `App.js`:

1. Find your Mac's IP address: **192.168.1.14** (already detected)
2. Open `mobile/App.js`
3. Find line 36: `return 'http://localhost:8000';`
4. Change to: `return 'http://192.168.1.14:8000';`

**Important:** 
- Your Mac and iPhone must be on the **same Wi-Fi network**
- Make sure the backend is running on your Mac

## 4. Build and Run

1. Press **Cmd + R** or click the **Play** button (▶️)
2. First build may take 3-5 minutes
3. The app will launch on your device/simulator

## 5. Backend Server

Make sure the backend is running:

```bash
cd "/Volumes/Austin's Flash Drive (Mac)/JailbreakAI/backend"
source venv/bin/activate
python main.py
```

The backend should be accessible at:
- Simulator: `http://localhost:8000`
- Physical Device: `http://192.168.1.14:8000`

## Troubleshooting

### Build Errors
- **Clean Build:** `Product > Clean Build Folder` (Shift + Cmd + K)
- **Reinstall Pods:** 
  ```bash
  cd mobile/ios
  pod deintegrate
  pod install
  ```

### Network Issues (Physical Device)
- Ensure Mac and iPhone are on same Wi-Fi
- Check Mac's firewall allows port 8000
- Verify backend is running: `curl http://192.168.1.14:8000`

### Permission Issues
All permissions are configured in `Info.plist`:
- Camera ✅
- Photo Library ✅
- Microphone ✅

## Features Ready

✅ Login/Signup
✅ Chat with AI
✅ Image generation and editing
✅ Video generation
✅ Music generation with MIDI export
✅ CAD/3D tools (STL/SVG)
✅ Skills dashboard
✅ To-Do List with Things 3 integration
✅ Wallet management
✅ All tabs and navigation

## Next Steps

1. Build and test on simulator first
2. Test all features
3. Update API URL for physical device testing
4. Test on physical iPhone
5. Ready for App Store submission!

---

**Your Mac's IP:** 192.168.1.14
**Backend Port:** 8000
**Workspace:** `ios/JailbreakAI.xcworkspace` ✅ OPENED

