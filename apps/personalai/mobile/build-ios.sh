#!/bin/bash

# iOS Build Script for Jailbreak AI
# This script prepares the project for Xcode

echo "🚀 Preparing Jailbreak AI for iOS build..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from mobile directory"
    exit 1
fi

# Install npm dependencies
echo "📦 Installing npm dependencies..."
npm install

# Install CocoaPods dependencies
echo "📦 Installing CocoaPods dependencies..."
cd ios
pod install
cd ..

echo "✅ Dependencies installed!"
echo ""
echo "📱 Next steps:"
echo "1. Open Xcode: open ios/JailbreakAI.xcworkspace"
echo "2. Select your development team in Signing & Capabilities"
echo "3. Choose your iPhone or simulator"
echo "4. Press Cmd+R to build and run"
echo ""
echo "💡 Tip: For physical device, update API URL in App.js with your Mac's IP address"
echo "   Find your IP: ipconfig getifaddr en0"

