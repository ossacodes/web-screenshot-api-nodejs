const express = require('express');
const fs = require('fs');
const path = require('path');

// Smart Chrome/Puppeteer detection for different environments
let puppeteer, chromium;

async function initializeBrowser() {
  try {
    // Try chrome-aws-lambda first (best for cloud environments)
    chromium = require('chrome-aws-lambda');
    console.log('Using chrome-aws-lambda for cloud deployment');
    return chromium;
  } catch (e) {
    try {
      // Fall back to regular puppeteer
      puppeteer = require('puppeteer');
      console.log('Using regular puppeteer');
      return puppeteer;
    } catch (e2) {
      try {
        // Last resort: puppeteer-core
        puppeteer = require('puppeteer-core');
        console.log('Using puppeteer-core');
        return puppeteer;
      } catch (e3) {
        throw new Error('No suitable browser launcher found. Please install puppeteer or chrome-aws-lambda.');
      }
    }
  }
}

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Screenshot API',
    version: '1.0.0',
    description: 'Take website screenshots programmatically',
    endpoints: {
      'POST /screenshot': 'Take a screenshot of a website',
      'GET /health': 'Health check endpoint'
    },
    documentation: 'https://github.com/ossacodes/web-screenshot-api-nodejs'
  });
});

// Screenshot endpoint
app.post('/screenshot', async (req, res) => {
  const { 
    url, 
    width = 1920, 
    height = 1080, 
    fullPage = false, 
    format = 'png',
    waitStrategy = 'networkidle2', // faster default
    maxWaitTime = 10000, // configurable wait time
    blockResources = false // option to block ads/analytics
  } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  let browser;
  const startTime = Date.now();
  
  try {
    // Initialize browser launcher
    const launcher = await initializeBrowser();
    
    // Launch browser based on available launcher
    if (launcher === chromium) {
      // Use chrome-aws-lambda
      browser = await chromium.puppeteer.launch({
        args: [
          ...chromium.args,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--single-process'
        ],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
      });
    } else {
      // Use regular puppeteer or puppeteer-core
      const browserArgs = [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ];

      if (process.env.NODE_ENV === 'production') {
        browserArgs.push('--single-process');
      }

      browser = await launcher.launch({
        headless: 'new',
        args: browserArgs
      });
    }

    const page = await browser.newPage();
    
    // Optional: Block unnecessary resources for faster loading
    if (blockResources) {
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (['stylesheet', 'font', 'image'].includes(resourceType)) {
          req.abort();
        } else {
          req.continue();
        }
      });
    }
    
    // Set viewport
    await page.setViewport({ width, height });
    
    // Navigate to URL with configurable wait strategy
    await page.goto(url, { 
      waitUntil: waitStrategy,
      timeout: 30000 
    });

    // Configurable wait time instead of fixed 2 seconds
    if (maxWaitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, Math.min(maxWaitTime, 10000)));
    }

    // Only wait for images if not blocking resources
    if (!blockResources) {
      try {
        await Promise.race([
          page.evaluate(async () => {
            const selectors = Array.from(document.querySelectorAll("img"));
            await Promise.all(selectors.map(img => {
              if (img.complete) return Promise.resolve();
              return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => resolve(), 5000); // 5s max per image
                img.addEventListener('load', () => {
                  clearTimeout(timeout);
                  resolve();
                });
                img.addEventListener('error', () => {
                  clearTimeout(timeout);
                  resolve(); // Don't fail on broken images
                });
              });
            }));
          }),
          new Promise(resolve => setTimeout(resolve, 8000)) // Max 8s total for all images
        ]);
      } catch (error) {
        console.warn('Image loading timeout, proceeding with screenshot');
      }
    }

    // Take screenshot
    const screenshot = await page.screenshot({
      type: format,
      fullPage: fullPage,
      encoding: 'base64'
    });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `screenshot-${timestamp}.${format}`;
    const filepath = path.join(__dirname, filename);

    // Save screenshot to file
    const buffer = Buffer.from(screenshot, 'base64');
    fs.writeFileSync(filepath, buffer);

    const totalTime = Date.now() - startTime;

    res.json({
      success: true,
      screenshot: `data:image/${format};base64,${screenshot}`,
      url: url,
      dimensions: { width, height },
      fullPage: fullPage,
      savedAs: filename,
      filepath: filepath,
      processingTime: `${totalTime}ms`,
      settings: {
        waitStrategy,
        maxWaitTime,
        blockResources
      }
    });

  } catch (error) {
    console.error('Screenshot error:', error);
    res.status(500).json({ 
      error: 'Failed to take screenshot',
      message: error.message 
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Screenshot API running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('Endpoints:');
  console.log('  GET  / - API information');
  console.log('  POST /screenshot - Take a screenshot');
  console.log('  GET  /health - Health check');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});