const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Increase memory limit for Node.js
if (process.env.NODE_OPTIONS) {
  process.env.NODE_OPTIONS += ' --max-old-space-size=512';
} else {
  process.env.NODE_OPTIONS = '--max-old-space-size=512';
}

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
    blockResources = false, // option to block ads/analytics
    timeout = 45000, // configurable navigation timeout (45s default)
    lowMemoryMode = false // simplified mode for very low memory environments
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

  // Validate timeout
  if (timeout < 5000 || timeout > 60000) {
    return res.status(400).json({ 
      error: 'Invalid timeout. Timeout must be between 5000-60000 ms (5-60 seconds)' 
    });
  }

  let browser;
  const startTime = Date.now();
  
  // Log memory before starting
  const memBefore = process.memoryUsage();
  console.log('Memory before screenshot:', Math.round(memBefore.heapUsed / 1024 / 1024) + ' MB');
  
  try {
    // Launch browser with optimized settings for Render.com
    const browserArgs = [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', // overcome limited resource problems
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--single-process', // Important for Render.com
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--memory-pressure-off', // Disable memory pressure notifications
      '--max_old_space_size=512', // Limit memory usage
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding'
    ];

    // Add extra memory optimizations for low memory mode
    if (lowMemoryMode) {
      browserArgs.push(
        '--disable-extensions',
        '--disable-plugins',
        '--disable-images',
        '--disable-javascript',
        '--aggressive-cache-discard'
      );
    }

    browser = await puppeteer.launch({
      headless: 'new',
      args: browserArgs,
      executablePath: puppeteer.executablePath(),
      defaultViewport: null,
      timeout: 30000 // Browser launch timeout
    });

    console.log('Browser launched successfully');

    const page = await browser.newPage();
    
    // Set memory and performance optimizations
    await page.setDefaultNavigationTimeout(timeout);
    await page.setDefaultTimeout(30000);
    
    // Optimize page settings for low memory
    await page.evaluateOnNewDocument(() => {
      // Disable some heavy features
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });
    
    // Optional: Block unnecessary resources for faster loading
    if (blockResources || lowMemoryMode) {
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        const url = req.url();
        
        // Block unnecessary resources to save memory
        if (['stylesheet', 'font', 'image', 'media'].includes(resourceType) ||
            url.includes('google-analytics') ||
            url.includes('facebook.com') ||
            url.includes('doubleclick') ||
            url.includes('googletagmanager')) {
          req.abort();
        } else {
          req.continue();
        }
      });
    }
    
    // Set viewport
    await page.setViewport({ width, height });
    
    // Navigate to URL with configurable wait strategy and timeout
    try {
      await page.goto(url, { 
        waitUntil: waitStrategy,
        timeout: timeout
      });
    } catch (error) {
      if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        // Try with a more lenient wait strategy
        console.log(`Navigation timeout with ${waitStrategy}, trying with 'domcontentloaded'...`);
        try {
          await page.goto(url, { 
            waitUntil: 'domcontentloaded',
            timeout: Math.min(timeout, 30000)
          });
        } catch (fallbackError) {
          throw new Error(`Navigation timeout: Website took longer than ${timeout}ms to load. Try increasing the timeout parameter or check if the website is accessible.`);
        }
      } else {
        throw error;
      }
    }

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

    // Log memory after screenshot
    const memAfter = process.memoryUsage();
    console.log('Memory after screenshot:', Math.round(memAfter.heapUsed / 1024 / 1024) + ' MB');

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
        blockResources,
        timeout,
        lowMemoryMode
      }
    });

  } catch (error) {
    console.error('Screenshot error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to take screenshot';
    let statusCode = 500;
    
    if (error.message.includes('timeout') || error.message.includes('Navigation timeout')) {
      errorMessage = error.message;
      statusCode = 408; // Request Timeout
    } else if (error.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
      errorMessage = 'Website not found or DNS resolution failed';
      statusCode = 404;
    } else if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
      errorMessage = 'Connection to website was refused';
      statusCode = 503;
    } else if (error.message.includes('net::ERR_CERT_')) {
      errorMessage = 'SSL certificate error - the website has security issues';
      statusCode = 502;
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      originalError: error.message,
      suggestions: statusCode === 408 ? [
        'Try increasing the timeout parameter (max 60000ms)',
        'Use waitStrategy: "domcontentloaded" for faster loading',
        'Enable blockResources: true to skip images/CSS'
      ] : []
    });
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log('Browser closed successfully');
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  const memUsage = process.memoryUsage();
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB'
    },
    uptime: Math.round(process.uptime()) + ' seconds',
    nodeVersion: process.version
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Screenshot API running on port ${port}`);
  console.log('Node.js version:', process.version);
  console.log('Memory usage:', process.memoryUsage());
  console.log('Endpoints:');
  console.log('  POST /screenshot - Take a screenshot');
  console.log('  GET /health - Health check');
});

// Handle process termination gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Memory monitoring
setInterval(() => {
  const usage = process.memoryUsage();
  console.log('Memory usage:', {
    rss: Math.round(usage.rss / 1024 / 1024) + ' MB',
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + ' MB',
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + ' MB'
  });
}, 60000); // Log every minute