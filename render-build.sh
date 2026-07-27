#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install ffmpeg on Render's Linux environment
apt-get update && apt-get install -y ffmpeg

# Install Python requirements
pip install -r requirements.txt