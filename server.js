const express = require('express');
const { getBrowser, closeBrowser } = require('./browser-config');
const app = express();

// Use PORT environment variable for deployment platforms
const port = process.env.PORT || 8080;

app.use(express.json({ limit: '10mb' }));

// Add CORS headers for RapidAPI
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// Health check endpoint (required for App Platform)
app.get('/health', async (req, res) => {
  try {
    // Test browser availability
    const browser = await getBrowser();
    const version = await browser.version();
    
    res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      workingDirectory: process.cwd(),
      nodeVersion: process.version,
      puppeteerVersion: version,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || 'bundled'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Screenshot endpoint
app.post('/screenshot', async (req, res) => {
  const { 
    url, 
    width = 1280, 
    height = 720, 
    fullPage = false, 
    format = 'png',
    waitStrategy = 'networkidle2',
    maxWaitTime = 5000,
    blockResources = false,
    deviceScaleFactor = 1,
    quality = 80
  } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Validate URL
  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  let page;
  const startTime = Date.now();
  
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    
    // Configure page with timeouts
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);
    
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
    await page.setViewport({ 
      width: Math.min(width, 1920), 
      height: Math.min(height, 1080),
      deviceScaleFactor: Math.min(deviceScaleFactor, 2)
    });
    
    // Navigate to URL
    await page.goto(url, { 
      waitUntil: waitStrategy,
      timeout: 30000 
    });

    // Wait for additional content
    if (maxWaitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, Math.min(maxWaitTime, 10000)));
    }

    // Wait for images to load if not blocking resources
    if (!blockResources) {
      try {
        await Promise.race([
          page.evaluate(async () => {
            const selectors = Array.from(document.querySelectorAll("img"));
            await Promise.all(selectors.map(img => {
              if (img.complete) return Promise.resolve();
              return new Promise((resolve) => {
                const timeout = setTimeout(() => resolve(), 3000);
                img.addEventListener('load', () => {
                  clearTimeout(timeout);
                  resolve();
                });
                img.addEventListener('error', () => {
                  clearTimeout(timeout);
                  resolve();
                });
              });
            }));
          }),
          new Promise(resolve => setTimeout(resolve, 5000))
        ]);
      } catch (error) {
        console.warn('Image loading timeout, proceeding with screenshot');
      }
    }

    // Take screenshot
    const screenshotOptions = {
      type: format,
      fullPage: fullPage
    };
    
    if (format === 'jpeg') {
      screenshotOptions.quality = Math.min(Math.max(quality, 1), 100);
    }

    const screenshot = await page.screenshot(screenshotOptions);

    const totalTime = Date.now() - startTime;

    // Return binary data for better performance
    res.set({
      'Content-Type': `image/${format}`,
      'Content-Length': screenshot.length,
      'Cache-Control': 'no-cache',
      'X-Processing-Time': `${totalTime}ms`
    });

    res.send(screenshot);

  } catch (error) {
    console.error('Screenshot error:', error);
    res.status(500).json({ 
      error: 'Failed to take screenshot',
      message: error.message 
    });
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (err) {
        console.warn('Error closing page:', err);
      }
    }
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test browser availability
    const browser = await getBrowser();
    const version = await browser.version();
    
    res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      workingDirectory: process.cwd(),
      nodeVersion: process.version,
      puppeteerVersion: version,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || 'bundled'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Screenshot API running on port ${port}`);
  console.log('Endpoints:');
  console.log('  POST /screenshot - Take a screenshot');
  console.log('  GET /health - Health check');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown for App Platform
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  try {
    await closeBrowser();
    console.log('Browser closed successfully');
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  try {
    await closeBrowser();
    console.log('Browser closed successfully');
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
  process.exit(0);
});