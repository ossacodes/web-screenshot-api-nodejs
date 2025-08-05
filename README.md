# Screenshot API

A production-ready screenshot API built with Node.js, Express, and Puppeteer, optimized for deployment on RapidAPI.

## Features

- Take screenshots of any website
- Configurable dimensions and formats
- Full page or viewport screenshots
- Base64 encoded response
- Resource blocking for faster performance
- Optimized for cloud deployment

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
  "maxWaitTime": 10000,
  "blockResources": false
}
```

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
    "maxWaitTime": 10000,
    "blockResources": false
  }
}
```

### GET /health

Health check endpoint.

## Deployment

### Railway (Recommended)

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app)
3. Connect your GitHub repository
4. Deploy automatically

### Render

1. Push your code to GitHub
2. Go to [render.com](https://render.com)
3. Create a new Web Service
4. Connect your GitHub repository
5. Deploy

### Digital Ocean App Platform

1. Push your code to GitHub
2. Go to Digital Ocean App Platform
3. Create a new App
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
