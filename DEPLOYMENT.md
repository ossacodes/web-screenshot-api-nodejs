# DigitalOcean App Platform Deployment Guide

This README provides step-by-step instructions for deploying your Screenshot API to DigitalOcean App Platform.

## 📁 Files Added for Deployment

The following configuration files have been created:

- **`app.yaml`** - App Platform configuration
- **`.buildpacks`** - Buildpack configuration for Chrome installation
- **`browser-config.js`** - Optimized browser configuration for cloud deployment

## 🚀 Deployment Steps

### 1. Push Changes to GitHub

First, commit and push all the new configuration files:

```bash
git add .
git commit -m "Add DigitalOcean App Platform configuration"
git push origin main
```

### 2. Create App on DigitalOcean App Platform

1. Log into your DigitalOcean account
2. Go to **Apps** in the left sidebar
3. Click **"Create App"**
4. Choose **GitHub** as your source
5. Select your repository: `ossacodes/web-screenshot-api-nodejs`
6. Choose the **main** branch
7. App Platform will automatically detect the `app.yaml` configuration

### 3. Review Configuration

App Platform should automatically configure:
- **Service Type**: Web Service
- **Instance Size**: basic-s (1GB RAM - required for Puppeteer)
- **Port**: 8080
- **Environment Variables**:
  - `NODE_ENV=production`
  - `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`
  - `PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable`

### 4. Deploy

1. Click **"Next"** through the configuration screens
2. Review the final configuration
3. Click **"Create Resources"**
4. Wait for the deployment to complete (usually 5-10 minutes)

## 🔧 Configuration Details

### App.yaml Configuration

```yaml
name: screenshot-api
services:
- name: web
  instance_size_slug: basic-s  # 1GB RAM minimum for Puppeteer
  http_port: 8080
  envs:
  - key: NODE_ENV
    value: production
  - key: PUPPETEER_SKIP_CHROMIUM_DOWNLOAD
    value: "true"
  - key: PUPPETEER_EXECUTABLE_PATH
    value: "/usr/bin/google-chrome-stable"
```

### Chrome Installation

The `.buildpacks` file ensures Chrome is installed:
```
https://github.com/heroku/heroku-buildpack-google-chrome.git
https://github.com/heroku/heroku-buildpack-nodejs.git
```

### Browser Configuration

The `browser-config.js` provides:
- Production-optimized Chrome arguments
- Automatic environment detection
- Browser instance management
- Graceful shutdown handling

## 📊 Monitoring & Health Checks

### Health Check Endpoint

Your app includes a health check endpoint at `/health`:

```bash
curl https://your-app-url.ondigitalocean.app/health
```

This endpoint:
- Tests browser availability
- Returns environment information
- Shows Chrome executable path
- Provides system status

### App Platform Monitoring

DigitalOcean App Platform provides:
- Real-time logs
- Resource usage metrics
- Health check monitoring
- Automatic restarts on failure

## 🧪 Testing Your Deployment

### 1. Test Health Endpoint

```bash
curl https://your-app-url.ondigitalocean.app/health
```

### 2. Test Screenshot Endpoint

```bash
curl -X POST https://your-app-url.ondigitalocean.app/screenshot \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "width": 1280,
    "height": 720,
    "format": "png"
  }' \
  --output screenshot.png
```

## 🔍 Troubleshooting

### Common Issues

1. **Chrome Not Found**
   - Check build logs for Chrome installation
   - Verify `.buildpacks` file is present
   - Ensure environment variables are set correctly

2. **Memory Issues**
   - Ensure using at least `basic-s` instance size (1GB RAM)
   - Consider upgrading to `professional-xs` (2GB RAM) for production

3. **Timeout Issues**
   - App Platform has request timeouts
   - Optimize screenshot parameters
   - Use `blockResources: true` for faster screenshots

### Viewing Logs

1. Go to your app in the DigitalOcean dashboard
2. Click on the **Runtime Logs** tab
3. Monitor for Chrome executable detection and errors

### Environment Variables

If needed, you can override environment variables in the App Platform dashboard:
- Go to **Settings** → **App-Level Environment Variables**
- Add or modify variables as needed

## 🎯 API Endpoints

### POST /screenshot

Take a screenshot of a webpage:

```json
{
  "url": "https://example.com",
  "width": 1280,
  "height": 720,
  "fullPage": false,
  "format": "png",
  "waitStrategy": "networkidle2",
  "maxWaitTime": 5000,
  "blockResources": false,
  "deviceScaleFactor": 1,
  "quality": 80
}
```

### GET /health

Health check endpoint that returns system status.

## 📈 Performance Optimization

### Instance Sizing

- **basic-s** (1GB RAM): Suitable for light usage
- **professional-xs** (2GB RAM): Recommended for production
- **professional-s** (4GB RAM): High-volume usage

### Screenshot Optimization

- Use `blockResources: true` to skip loading CSS/images for faster screenshots
- Reduce `width` and `height` for smaller files
- Use `jpeg` format with quality settings for smaller file sizes
- Set appropriate `maxWaitTime` based on your needs

## 🔗 Useful Links

- [DigitalOcean App Platform Documentation](https://docs.digitalocean.com/products/app-platform/)
- [Puppeteer Documentation](https://pptr.dev/)
- [Your GitHub Repository](https://github.com/ossacodes/web-screenshot-api-nodejs)

---

After successful deployment, your Screenshot API will be available at:
`https://screenshot-api-xxxxx.ondigitalocean.app`

Replace `xxxxx` with your actual app identifier provided by DigitalOcean.
