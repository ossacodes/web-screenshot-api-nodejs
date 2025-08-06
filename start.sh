#!/bin/bash

echo "Starting Screenshot API..."

# Check if system Chrome is available
if command -v google-chrome >/dev/null 2>&1; then
    echo "System Chrome found: $(google-chrome --version)"
elif command -v google-chrome-stable >/dev/null 2>&1; then
    echo "System Chrome found: $(google-chrome-stable --version)"
else
    echo "System Chrome not found. Checking Puppeteer cache..."
    
    # Check if Puppeteer has downloaded Chrome
    if [ ! -d "/usr/src/app/.cache/puppeteer" ] || [ -z "$(ls -A /usr/src/app/.cache/puppeteer 2>/dev/null)" ]; then
        echo "Puppeteer cache empty. Downloading Chrome..."
        npx puppeteer browsers install chrome
    else
        echo "Puppeteer cache found: $(ls -la /usr/src/app/.cache/puppeteer)"
    fi
fi

echo "Starting Node.js server..."
exec node server.js
