const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const app = express();

// Use PORT environment variable for deployment platforms
const port = process.env.PORT || 3000;

app.use(express.json());

// Add CORS headers for RapidAPI
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
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
    // Launch browser with optimized settings for production
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
        '--single-process', // Important for some hosting platforms
        '--disable-features=VizDisplayCompositor'
      ]
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

    const totalTime = Date.now() - startTime;

    res.json({
      success: true,
      screenshot: `data:image/${format};base64,${screenshot}`,
      url: url,
      dimensions: { width, height },
      fullPage: fullPage,
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

app.listen(port, () => {
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