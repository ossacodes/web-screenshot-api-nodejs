const puppeteer = require('puppeteer');

async function test() {
  console.log('Testing Puppeteer...');
  
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    console.log('Browser launched successfully!');
    
    const page = await browser.newPage();
    await page.goto('https://example.com');
    
    console.log('Page loaded successfully!');
    
    await browser.close();
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

test();
