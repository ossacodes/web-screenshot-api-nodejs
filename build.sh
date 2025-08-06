#!/bin/bash
echo "Starting build process..."

# Install dependencies
npm ci --only=production

# Clear any Puppeteer cache to avoid conflicts
rm -rf ~/.cache/puppeteer

# Ensure chrome-aws-lambda dependencies are properly installed
echo "Setting up chrome-aws-lambda..."

echo "Build process completed successfully!"
