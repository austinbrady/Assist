# Quick Start - iOS Build

## 🚀 Fastest Way to Build

```bash
cd mobile
./build-ios.sh
open ios/JailbreakAI.xcworkspace
```

Then in Xcode:
1. Select your team in Signing & Capabilities
2. Choose your iPhone/simulator
3. Press `Cmd + R`

## 📱 For Physical iPhone

1. Find your Mac's IP:
   ```bash
   ipconfig getifaddr en0
   ```

2. Update `App.js` line 31:
   ```javascript
   return 'http://192.168.1.XXX:8000'; // Your Mac's IP
   ```

3. Make sure Mac and iPhone are on same Wi-Fi

4. Start backend:
   ```bash
   cd backend
   source venv/bin/activate
   python main.py
   ```

## ✅ Ready to Build!

- ✅ All dependencies configured
- ✅ iOS permissions set
- ✅ Xcode project ready
- ✅ Build script created
- ✅ Info.plist configured

Just open the workspace and build! 🎉

