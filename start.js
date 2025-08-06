#!/usr/bin/env node

console.log('🚀 Starting Screenshot API...');
console.log('Node.js version:', process.version);
console.log('Memory limits:', process.env.NODE_OPTIONS);

const memUsage = process.memoryUsage();
console.log('Initial memory usage:', {
  rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
  heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
  heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB'
});

// Test if Puppeteer can be loaded
try {
  console.log('📦 Testing Puppeteer...');
  const puppeteer = require('puppeteer');
  console.log('✅ Puppeteer loaded successfully');
  console.log('Chrome executable:', puppeteer.executablePath());
} catch (error) {
  console.error('❌ Puppeteer failed to load:', error.message);
  process.exit(1);
}

// Start the actual server
console.log('🌐 Starting Express server...');
require('./server.js');
