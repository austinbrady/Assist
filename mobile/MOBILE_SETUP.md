# Mobile App Setup Guide

## Quick Start

1. **Install Expo CLI:**
   ```bash
   npm install -g expo-cli
   ```

2. **Install dependencies:**
   ```bash
   cd mobile
   npm install
   ```

3. **Configure your server IP:**
   - Open `App.js`
   - Find line with `getApiUrl()`
   - Replace `localhost` with your computer's IP address
   - Example: `return 'http://192.168.1.14:8000';`

4. **Start backend server** (from main directory):
   ```bash
   ./JailbreakAI.app
   ```

5. **Start mobile app:**
   ```bash
   cd mobile
   npm start
   ```

6. **Run on your phone:**
   - Install "Expo Go" app from App Store/Google Play
   - Scan the QR code shown in terminal
   - App will load on your phone!

## Finding Your IP Address

**macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```bash
ipconfig
```
Look for IPv4 address (usually 192.168.x.x)

## Features

✅ Chat with AI
✅ Generate images from text
✅ Generate videos
✅ Write songs
✅ Upload and edit images

All features work the same as the web version!

