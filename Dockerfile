FROM node:18-slim

# Install dependencies for Puppeteer
RUN apt-get update \
    && apt-get install -y wget gnupg ca-certificates \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Create cache directory with proper permissions
RUN mkdir -p /usr/src/app/.cache/puppeteer \
    && chmod 755 /usr/src/app/.cache/puppeteer

# Set environment variables for production
ENV NODE_ENV=production
ENV PUPPETEER_CACHE_DIR=/usr/src/app/.cache/puppeteer

# Copy package files
COPY package*.json ./

# Install app dependencies and let Puppeteer download Chrome as fallback
RUN npm ci --only=production

# Bundle app source
COPY . .

# Make start script executable
RUN chmod +x start.sh

# Debug: Check where Chrome is actually installed and verify it works
RUN echo "=== Chrome Installation Check ===" \
    && which google-chrome || echo "google-chrome not in PATH" \
    && which google-chrome-stable || echo "google-chrome-stable not in PATH" \
    && ls -la /usr/bin/google-chrome* || echo "No google-chrome files found in /usr/bin" \
    && ls -la /opt/google/chrome/ || echo "No Chrome found in /opt/google/chrome/" \
    && google-chrome --version || echo "Chrome version check failed" \
    && ls -la /usr/src/app/.cache/puppeteer || echo "No Puppeteer cache found" \
    && echo "=== End Chrome Check ==="

# Create a user to run the app (security best practice)
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /usr/src/app

# Run everything after as non-privileged user
USER pptruser

EXPOSE 3000

CMD ["./start.sh"]
