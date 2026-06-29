#!/bin/bash

# Configure macOS to prevent AppleDouble files on non-network volumes
# Run this script to reduce ._ file creation

echo "Configuring macOS settings to prevent AppleDouble files..."

# Prevent creation of .DS_Store files on network volumes
defaults write com.apple.desktopservices DSDontWriteNetworkStores -bool true

# Prevent creation of AppleDouble files
defaults write com.apple.desktopservices DSDontWriteUSBStores -bool true

# Disable creation of metadata files for external drives
defaults write com.apple.desktopservices DSDontWriteExternalStores -bool true

echo "✅ macOS settings configured."
echo "Note: You may need to restart your computer for all changes to take effect."
echo "Some ._ files may still be created during certain file operations."
echo "Use 'npm run clean:mac-files' to clean them up."
