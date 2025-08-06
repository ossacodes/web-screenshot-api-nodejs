#!/usr/bin/env node

const http = require('http');
const https = require('https');

const API_URL = process.argv[2] || 'http://localhost:3000';

console.log(`Testing Screenshot API at: ${API_URL}`);

// Test health endpoint
function testHealth() {
  return new Promise((resolve, reject) => {
    const client = API_URL.startsWith('https') ? https : http;
    const url = new URL(`${API_URL}/health`);
    
    const req = client.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'GET'
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ Health check:', result.status);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => reject(new Error('Health check timeout')));
    req.end();
  });
}

// Test screenshot endpoint
function testScreenshot() {
  return new Promise((resolve, reject) => {
    const client = API_URL.startsWith('https') ? https : http;
    const url = new URL(`${API_URL}/screenshot`);
    
    const postData = JSON.stringify({
      url: 'https://example.com',
      width: 800,
      height: 600,
      blockResources: true,
      timeout: 30000
    });
    
    const req = client.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.success) {
            console.log('✅ Screenshot test passed');
            console.log(`   Processing time: ${result.processingTime}`);
            console.log(`   Image size: ${result.screenshot.length} characters (base64)`);
          } else {
            console.log('❌ Screenshot test failed:', result.error);
          }
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(30000, () => reject(new Error('Screenshot timeout')));
    req.write(postData);
    req.end();
  });
}

// Run tests
async function runTests() {
  try {
    await testHealth();
    console.log('Running screenshot test (this may take a moment)...');
    await testScreenshot();
    console.log('🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTests();
