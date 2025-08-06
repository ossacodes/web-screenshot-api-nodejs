# DigitalOcean App Platform Deployment Guide

This guide will help you deploy your Screenshot API to DigitalOcean's App Platform.

## Prerequisites

1. GitHub repository with your code
2. DigitalOcean account
3. Your repository should be public or you need to connect your GitHub account

## Deployment Options

### Option 1: Using App Spec (Recommended)

1. **Push your code to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Prepare for DigitalOcean deployment"
   git push origin main
   ```

2. **Deploy using the App Spec file**
   - Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
   - Click "Create App"
   - Choose "GitHub" as your source
   - Select your repository: `ossacodes/web-screenshot-api-nodejs`
   - Choose the `main` branch
   - DigitalOcean will automatically detect the `.do/app.yaml` file
   - Review the configuration and click "Create Resources"

### Option 2: Manual Configuration

1. **Create New App**
   - Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
   - Click "Create App"
   - Choose "GitHub" as your source
   - Select your repository and branch

2. **Configure the Service**
   - **Name**: `screenshot-api`
   - **Source Directory**: `/` (root)
   - **Build Command**: `npm install`
   - **Run Command**: `npm start`
   - **HTTP Port**: `3000`
   - **Instance Size**: Basic ($5/month)

3. **Environment Variables**
   Add these environment variables:
   - `NODE_ENV`: `production`
   - `PUPPETEER_ARGS`: `--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage`

### Option 3: Docker Deployment

1. **Configure for Docker**
   - When creating the app, choose "Docker" as the source type
   - The Dockerfile will be automatically detected
   - Set the HTTP port to `3000`

## Configuration Details

### App Specifications
- **Runtime**: Node.js 18+
- **Memory**: 512MB minimum (recommended 1GB for better performance)
- **CPU**: 0.5 vCPU minimum
- **Disk**: 1GB
- **Scaling**: Can be configured for auto-scaling based on demand

### Environment Variables
The app will work with these environment variables:
- `PORT`: Set automatically by DigitalOcean
- `NODE_ENV`: Set to `production`
- `PUPPETEER_ARGS`: Additional Chrome arguments for cloud deployment

## Testing Your Deployment

Once deployed, test your API:

```bash
# Health check
curl https://your-app-name.ondigitalocean.app/health

# Screenshot endpoint
curl -X POST https://your-app-name.ondigitalocean.app/screenshot \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "width": 1280, "height": 720}'
```

## Cost Estimation

- **Basic Plan**: $5/month (512MB RAM, 0.5 vCPU)
- **Pro Plan**: $12/month (1GB RAM, 1 vCPU) - Recommended for production
- **Bandwidth**: $0.01/GB after 100GB/month

## Performance Optimization

For better performance in production:

1. **Increase Instance Size**: Use at least the Pro plan for consistent performance
2. **Enable Auto-scaling**: Configure based on your traffic patterns
3. **Monitor Resource Usage**: Watch CPU and memory usage in the dashboard
4. **Add Health Checks**: The API includes a `/health` endpoint for monitoring

## Troubleshooting

### Common Issues:

1. **Chrome/Puppeteer Issues**
   - The Dockerfile installs Chromium specifically for Alpine Linux
   - App Spec deployment uses the optimized Puppeteer arguments

2. **Memory Issues**
   - Increase instance size if you see memory-related errors
   - Consider implementing request queuing for high traffic

3. **Timeout Issues**
   - DigitalOcean has a 5-minute request timeout limit
   - Optimize screenshot settings for faster processing

## Security Considerations

- The app runs as a non-root user in Docker
- Puppeteer runs in sandboxed mode
- No file system persistence (screenshots are returned as base64)

## Support

For issues specific to DigitalOcean deployment, check:
- [DigitalOcean App Platform Documentation](https://docs.digitalocean.com/products/app-platform/)
- [Community Q&A](https://www.digitalocean.com/community/questions)
