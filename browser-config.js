const puppeteer = require('puppeteer');

const getBrowserConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production' || 
                      process.env.CONTAINER === 'true' ||
                      process.env.DOCKER === 'true' ||
                      process.cwd().includes('/workspace');
  
  if (isProduction) {
    console.log('Production environment detected, using optimized Chrome config');
    
    // Try to find Chrome executable in DigitalOcean App Platform
    const fs = require('fs');
    const possiblePaths = [
      process.env.PUPPETEER_EXECUTABLE_PATH,
      '/app/.apt/usr/bin/google-chrome',  // Heroku/App Platform buildpack path
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/opt/google/chrome/chrome',
      '/opt/google/chrome/google-chrome'
    ];
    
    let executablePath = null;
    
    for (const path of possiblePaths) {
      if (path && fs.existsSync(path)) {
        try {
          fs.accessSync(path, fs.constants.F_OK | fs.constants.X_OK);
          executablePath = path;
          console.log(`Found Chrome executable at: ${path}`);
          break;
        } catch (err) {
          console.log(`Chrome exists but not executable: ${path}`);
        }
      }
    }
    
    if (!executablePath) {
      console.log('No Chrome executable found, letting Puppeteer find it automatically');
      // Don't set executablePath, let Puppeteer handle it
    }
    
    const config = {
      headless: 'new',
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
    
    // Only set executablePath if we found one
    if (executablePath) {
      config.executablePath = executablePath;
    }
    
    return config;
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
    
    // Try multiple configurations if the first one fails
    const configs = [
      getBrowserConfig(),
      // Fallback config without executablePath
      {
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--no-first-run',
          '--no-zygote',
          '--single-process'
        ]
      }
    ];
    
    for (let i = 0; i < configs.length; i++) {
      try {
        console.log(`Trying browser config ${i + 1}/${configs.length}...`);
        browser = await puppeteer.launch(configs[i]);
        console.log(`Browser launched successfully with config ${i + 1}`);
        break;
      } catch (error) {
        console.log(`Config ${i + 1} failed:`, error.message);
        if (i === configs.length - 1) {
          throw new Error(`All browser configurations failed. Last error: ${error.message}`);
        }
      }
    }
    
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
