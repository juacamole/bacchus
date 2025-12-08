#!/bin/bash

# Simple script to run Ionic app on emulator with live reload
# Usage: ./run-app.sh [emulator-id]

# Set Android SDK environment variables
export ANDROID_SDK_ROOT=/opt/android-sdk
export ANDROID_HOME=/opt/android-sdk
export PATH=$PATH:$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/emulator

# Check if emulator ID was provided
if [ -z "$1" ]; then
    echo "🔍 Checking for running emulators..."
    DEVICES=$(adb devices | grep -v "List of devices" | grep "device$")
    
    if [ -z "$DEVICES" ]; then
        echo "❌ No emulator found!"
        echo "   Please start the emulator first: ./start-emulator.sh"
        echo "   Or specify emulator ID: ./run-app.sh emulator-5554"
        exit 1
    fi
    
    # Get first device
    TARGET=$(echo "$DEVICES" | head -1 | awk '{print $1}')
    echo "✅ Found emulator: $TARGET"
else
    TARGET=$1
    echo "📱 Using emulator: $TARGET"
fi

# Check if www directory exists
if [ ! -d "www" ]; then
    echo "📦 Building web app first..."
    npm run build
fi

# Run the app
echo "🚀 Running app on $TARGET with live reload..."
ionic capacitor run android -l --external --target=$TARGET

