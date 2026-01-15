#!/bin/bash

# Post-install script to fix React Native Skia build configuration

SKIA_BUILD_FILE="node_modules/@shopify/react-native-skia/android/build.gradle"

if [ -f "$SKIA_BUILD_FILE" ]; then
  echo "Patching Skia build.gradle to fix React Native dependency resolution..."

  # Replace the dynamic dependency with a fixed one
  sed -i "s/implementation 'com.facebook.react:react-native:+'/implementation 'com.facebook.react:react-android:0.73.2'/g" "$SKIA_BUILD_FILE"

  echo "Skia build.gradle patched successfully!"
else
  echo "Skia build.gradle not found, skipping patch."
fi
