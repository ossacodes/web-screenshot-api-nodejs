# Render.com Deployment Guide

## Quick Deploy (Recommended)

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Deploy on Render.com**:
   - Go to [render.com](https://render.com) and sign in
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `ossacodes/web-screenshot-api-nodejs`
   - Configure the service:
     - **Name**: `screenshot-api` (or your preferred name)
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Plan**: Start with "Starter" ($7/month)

3. **Environment Variables** (Optional but recommended):
   - `NODE_ENV` = `production`
   - `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` = `false`

4. **Deploy**: Click "Create Web Service"

## Alternative: Docker Deployment

If you prefer Docker deployment:

1. In your Render service settings, choose:
   - **Environment**: `Docker`
   - **Dockerfile Path**: `Dockerfile` (default)

## Testing Your Deployment

After deployment, test your API:

```bash
# Health check
curl https://your-app-name.onrender.com/health

# Basic screenshot test
curl -X POST https://your-app-name.onrender.com/screenshot \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "width": 800, "height": 600}'

# For slow websites, increase timeout
curl -X POST https://your-app-name.onrender.com/screenshot \
  -H "Content-Type: application/json" \
  -d '{"url": "https://slow-website.com", "timeout": 60000, "waitStrategy": "domcontentloaded"}'
```

## Important Notes

- **Cold Start**: Render's free tier has cold starts. The first request may take 30+ seconds
- **Memory Limits**: The starter plan has 0.5GB RAM. Consider upgrading if you see memory issues
- **Request Timeout**: Render has a 30-second request timeout
- **Storage**: Screenshots are temporarily stored but will be cleared between deployments

## Performance Tips

1. **Use smaller dimensions** for faster screenshots
2. **Enable resource blocking** for faster loading
3. **Consider upgrading to a paid plan** for better performance
4. **Use the health endpoint** to keep your service warm

## Monitoring

- Check logs in the Render dashboard
- Set up uptime monitoring (like UptimeRobot) to prevent cold starts
- Monitor memory usage in the Render dashboard

## Troubleshooting

### SIGTERM Errors and Memory Issues

If you see `npm error signal SIGTERM` or the app crashes:

1. **Memory optimization request:**
   ```json
   {
     "url": "https://example.com",
     "lowMemoryMode": true,
     "blockResources": true,
     "waitStrategy": "domcontentloaded"
   }
   ```

2. **Upgrade your Render plan:**
   - Starter plan has limited memory (512MB)
   - Consider upgrading to Standard plan for more memory

3. **Check memory usage:**
   ```bash
   curl https://your-app.onrender.com/health
   ```

4. **Use smaller dimensions:**
   ```json
   {
     "url": "https://example.com",
     "width": 800,
     "height": 600
   }
   ```

### Navigation Timeout Errors

If you get "Navigation timeout of 20000 ms exceeded" errors:

1. **Increase the timeout parameter:**
   ```json
   {
     "url": "https://slow-website.com",
     "timeout": 60000
   }
   ```

2. **Use a faster wait strategy:**
   ```json
   {
     "url": "https://example.com", 
     "waitStrategy": "domcontentloaded",
     "timeout": 45000
   }
   ```

3. **Enable resource blocking:**
   ```json
   {
     "url": "https://heavy-website.com",
     "blockResources": true,
     "waitStrategy": "domcontentloaded"
   }
   ```

### Other Common Issues

If deployment fails:
1. Check the build logs in Render dashboard
2. Ensure all dependencies are in `package.json`
3. Verify Node.js version compatibility
4. Check Chrome installation in logs

## Custom Domain (Optional)

Once deployed, you can:
1. Add a custom domain in Render dashboard
2. Configure DNS settings
3. SSL is automatically provided by Render
