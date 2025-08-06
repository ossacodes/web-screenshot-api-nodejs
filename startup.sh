#!/bin/bash
echo "=== DigitalOcean Screenshot API Startup ==="

# Check Node.js version
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"

# Check if chrome-aws-lambda is available
echo "Checking chrome-aws-lambda..."
if node -e "require('chrome-aws-lambda')" 2>/dev/null; then
    echo "✅ chrome-aws-lambda is available"
else
    echo "❌ chrome-aws-lambda not found"
fi

# Check if puppeteer is available
echo "Checking puppeteer..."
if node -e "require('puppeteer')" 2>/dev/null; then
    echo "✅ puppeteer is available"
else
    echo "❌ puppeteer not found"
fi

# List Chrome-related files
echo "Looking for Chrome executables..."
find /usr -name "*chrome*" 2>/dev/null | head -10 || echo "No Chrome executables found in /usr"

# Check puppeteer cache
echo "Checking Puppeteer cache..."
if [ -d "$HOME/.cache/puppeteer" ]; then
    echo "Puppeteer cache directory exists"
    ls -la "$HOME/.cache/puppeteer" 2>/dev/null || echo "Cache directory is empty"
else
    echo "No Puppeteer cache directory found"
fi

echo "=== Starting Screenshot API ==="
npm start
