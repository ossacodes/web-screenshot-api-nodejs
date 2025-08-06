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

# Screenshot test
curl -X POST https://your-app-name.onrender.com/screenshot \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "width": 800, "height": 600}'
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
