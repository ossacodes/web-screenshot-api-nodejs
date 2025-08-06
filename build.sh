#!/bin/bash
echo "Starting build process..."

# Install dependencies
npm ci --only=production

# Clear any Puppeteer cache
rm -rf ~/.cache/puppeteer

# Reinstall Puppeteer to ensure Chromium is downloaded
npm rebuild puppeteer

echo "Build process completed successfully!"
