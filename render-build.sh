#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "--- Installing static ffmpeg binary ---"
# Download official static ffmpeg build
wget -q https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz

# Extract files
tar -xf ffmpeg-release-amd64-static.tar.xz

# Create local bin directory if it doesn't exist
mkdir -p ~/.local/bin

# Move binaries to user's bin folder
mv ffmpeg-*-static/ffmpeg ~/.local/bin/
mv ffmpeg-*-static/ffprobe ~/.local/bin/

# Ensure local bin is available in PATH for current script execution
export PATH=$HOME/.local/bin:$PATH

# Clean up extracted archive and temporary directory
rm -rf ffmpeg-release-amd64-static.tar.xz ffmpeg-*-static

echo "--- Verifying ffmpeg installation ---"
ffmpeg -version | head -n 1

echo "--- Installing Python dependencies ---"
pip install --upgrade pip
pip install -r requirements.txt