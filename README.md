# Screenshot API

A production-ready screenshot API built with Node.js, Express, and Puppeteer, optimized for deployment on cloud platforms like Render.com.

## Features

- Take screenshots of any website
- Configurable dimensions and formats
- Full page or viewport screenshots
- Base64 encoded response
- Resource blocking for faster performance
- Optimized for cloud deployment
- CORS enabled for API usage
- Request validation and error handling

## Quick Deploy to Render.com

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

1. Click the deploy button above, or:
2. Fork this repository
3. Go to [render.com](https://render.com) and create a new Web Service
4. Connect your GitHub repository
5. Use these settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node.js

See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for detailed instructions.

## API Endpoints

### POST /screenshot

Takes a screenshot of the specified URL.

**Request Body:**
```json
{
  "url": "https://example.com",
  "width": 1920,
  "height": 1080,
  "fullPage": false,
  "format": "png",
  "waitStrategy": "networkidle2",
  "maxWaitTime": 5000,
  "blockResources": false
}
```

**Parameters:**
- `url` (required): Website URL to screenshot
- `width` (optional): Viewport width (100-3840, default: 1920)
- `height` (optional): Viewport height (100-2160, default: 1080)
- `fullPage` (optional): Capture full page (default: false)
- `format` (optional): Image format - 'png' or 'jpeg' (default: 'png')
- `waitStrategy` (optional): Loading strategy (default: 'networkidle2')
- `maxWaitTime` (optional): Max wait time in ms (default: 5000)
- `blockResources` (optional): Block CSS/images for faster loading (default: false)

**Response:**
```json
{
  "success": true,
  "screenshot": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "url": "https://example.com",
  "dimensions": { "width": 1920, "height": 1080 },
  "fullPage": false,
  "processingTime": "2500ms",
  "settings": {
    "waitStrategy": "networkidle2",
    "maxWaitTime": 5000,
    "blockResources": false
  }
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-08-06T18:58:33.561Z"
}
```

## Deployment

### Render.com (Recommended)

See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for complete deployment instructions.

**Quick Steps:**
1. Push code to GitHub
2. Connect repository to Render.com
3. Deploy with default Node.js settings

### Railway (Recommended for easiest setup)

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app)
3. Connect your GitHub repository
4. Deploy automatically

### Digital Ocean App Platform

**Option 1: Using chrome-aws-lambda (Recommended)**
1. The code includes automatic Chrome installation via `chrome-aws-lambda`
2. Push your code to GitHub
3. Create a new App on Digital Ocean App Platform
4. Connect your GitHub repository
5. Deploy (Chrome will be installed automatically)

**Option 2: Using Docker**
1. Make sure the Dockerfile is in your repository
2. Create a new App on Digital Ocean App Platform
3. Choose "Docker" as the source type
4. Connect your GitHub repository
5. Deploy

### Render

1. Push your code to GitHub
2. Go to [render.com](https://render.com)
3. Create a new Web Service
4. Connect your GitHub repository
5. Deploy

## Local Development

```bash
npm install
npm run dev
```

## Environment Variables

- `PORT`: Server port (default: 3000)

## License

MIT
# web-screenshot-api-nodejs
# web-screenshot-api-nodejs
