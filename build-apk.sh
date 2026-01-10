#!/bin/bash

echo "🎮 Building Tiny Platformer APK..."
echo ""

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    npm install
fi

# Build the APK
echo "🔨 Building Android APK..."
cd android
./gradlew assembleRelease

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo "📱 APK location: android/app/build/outputs/apk/release/app-release.apk"
    echo ""
    echo "To install on your device:"
    echo "  adb install android/app/build/outputs/apk/release/app-release.apk"
else
    echo ""
    echo "❌ Build failed. Please check the error messages above."
fi
