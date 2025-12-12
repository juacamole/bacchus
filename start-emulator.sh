#!/bin/bash

# Script to start Android emulator with correct SDK path

# Set Android SDK environment variables
export ANDROID_SDK_ROOT=/opt/android-sdk
export ANDROID_HOME=/opt/android-sdk
export PATH=$PATH:$ANDROID_SDK_ROOT/emulator:$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/tools/bin

echo "🔧 Setting ANDROID_SDK_ROOT to: $ANDROID_SDK_ROOT"

# Check if system images exist
SYSTEM_IMAGE_PATH="/opt/android-sdk/system-images/android-36.1/google_apis_playstore/x86_64"
if [ ! -d "$SYSTEM_IMAGE_PATH" ]; then
    echo "❌ ERROR: System images not found!"
    echo "   Expected location: $SYSTEM_IMAGE_PATH"
    echo ""
    echo "📱 You need to install the system images first."
    echo "   Run: ./install-system-images.sh for instructions"
    echo "   Or open Android Studio → SDK Manager → SDK Platforms"
    echo "   → Check 'Android 14.0 (API 36)' → Show Package Details"
    echo "   → Check 'Google Play' system image → Apply"
    exit 1
fi

echo "✅ System images found"
echo "📱 Starting emulator..."

# Start the emulator with graphics fixes
# -gpu swiftshader_indirect: Uses software rendering (fixes eglMakeCurrent errors)
# -no-snapshot-load: Prevents loading corrupted snapshots
# -no-audio: Disables audio (optional, can improve performance)
emulator -avd Medium_Phone_API_36.1 \
  -gpu swiftshader_indirect \
  -no-snapshot-load \
  -no-audio

