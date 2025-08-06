# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Node.js screenshot API built with Express and Puppeteer, designed for deployment on RapidAPI marketplace. The API captures website screenshots with configurable options including dimensions, formats, and optimization strategies.

## Development Commands

- **Start development server**: `npm run dev` (uses nodemon)
- **Start production server**: `npm start`
- **Install dependencies**: `npm install`

No test framework is currently configured in the project.

## Architecture

### Core Components

- **server.js**: Main application file containing:
  - Express server setup with CORS for RapidAPI
  - Chrome executable detection logic for containerized environments
  - Screenshot endpoint (`POST /screenshot`) with configurable parameters
  - Health check endpoint (`GET /health`)

### Chrome/Puppeteer Strategy

The application implements a sophisticated Chrome detection system:

1. **Dynamic Chrome Path Detection** (`server.js:20-94`): Checks multiple possible Chrome installation paths in containerized environments
2. **Environment-Aware Configuration**: Different browser launch options for local vs. production
3. **Fallback Mechanisms**: Falls back to Puppeteer's bundled Chromium if system Chrome isn't found

### Key Configuration Options

Screenshots support these parameters:
- `width/height`: Viewport dimensions (default: 1920x1080)
- `fullPage`: Full page vs. viewport capture
- `format`: png, jpeg, webp
- `waitStrategy`: networkidle2 (default), networkidle0, load, domcontentloaded
- `maxWaitTime`: Additional wait time (0-10000ms)
- `blockResources`: Block CSS/fonts/images for faster loading

## Deployment

### Docker Strategy
- **Dockerfile**: Multi-stage build with Chrome installation and non-root user setup
- **start.sh**: Startup script with Chrome verification and Puppeteer cache management
- Environment variables: `NODE_ENV=production`, `PUPPETEER_CACHE_DIR`

### Production Considerations
- Uses non-root `pptruser` for security
- Comprehensive Chrome installation with fallback to Puppeteer download
- Optimized browser launch args for containerized environments
- Resource blocking options for performance

## Port Configuration

Server runs on `process.env.PORT || 3000` for deployment platform compatibility.

## Key Files Structure

```
/
├── server.js           # Main application logic
├── package.json        # Dependencies and scripts
├── Dockerfile         # Container configuration  
├── start.sh          # Container startup script
├── README.md         # User documentation
└── RAPIDAPI_LAUNCH.md # RapidAPI marketplace documentation
```