const puppeteer = require('puppeteer');

const getBrowserConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production' || 
                      process.env.CONTAINER === 'true' ||
                      process.env.DOCKER === 'true' ||
                      process.cwd().includes('/workspace');
  
  if (isProduction) {
    console.log('Production environment detected, using optimized Chrome config');
    return {
      headless: 'new',
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-extensions',
        '--disable-default-apps',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-accelerated-2d-canvas',
        '--window-size=1920,1080'
      ]
    };
  }
  
  console.log('Development environment detected, using bundled Chromium');
  return { 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }; // Local development
};

let browser;

const getBrowser = async () => {
  if (!browser) {
    console.log('Launching new browser instance...');
    browser = await puppeteer.launch(getBrowserConfig());
    
    // Handle browser disconnection
    browser.on('disconnected', () => {
      console.log('Browser disconnected, will create new instance on next request');
      browser = null;
    });
    
    console.log('Browser launched successfully');
  }
  return browser;
};

// Gracefully close browser
const closeBrowser = async () => {
  if (browser) {
    console.log('Closing browser...');
    await browser.close();
    browser = null;
  }
};

module.exports = { getBrowser, closeBrowser };
