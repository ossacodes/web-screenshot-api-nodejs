const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Add CORS headers for API usage
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Root endpoint for API info
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
    maxWaitTime = 5000, // reduced for better performance on Render
    blockResources = false // option to block ads/analytics
  } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Validate URL format
  try {
    new URL(url);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  // Validate dimensions
  if (width < 100 || width > 3840 || height < 100 || height > 2160) {
    return res.status(400).json({ 
      error: 'Invalid dimensions. Width and height must be between 100-3840 and 100-2160 respectively' 
    });
  }

  let browser;
  const startTime = Date.now();
  
  try {
    // Launch browser with optimized settings for Render.com
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // overcome limited resource problems
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--single-process', // Important for Render.com
        '--no-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ],
      executablePath: puppeteer.executablePath()
    });

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
      timeout: 20000 // reduced timeout for Render
    });

    // Configurable wait time instead of fixed 2 seconds
    if (maxWaitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, Math.min(maxWaitTime, 5000))); // max 5s on Render
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
  console.log('Endpoints:');
  console.log('  POST /screenshot - Take a screenshot');
  console.log('  GET /health - Health check');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});