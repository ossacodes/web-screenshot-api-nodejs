# Screenshot API - RapidAPI Launch Guide

## API Overview

**Website Screenshot API** - A powerful, production-ready API that captures high-quality screenshots of any website. Perfect for web scraping, monitoring, testing, and content creation workflows.

### Key Features
- ⚡ Fast screenshot generation (2-5 seconds)
- 🎯 Customizable dimensions and formats
- 📱 Full page or viewport capture
- 🚀 Base64 encoded responses for easy integration
- 🔧 Advanced configuration options
- 🛡️ Production-ready and scalable

---

## API Endpoints

### 📸 POST /screenshot
**Generate a website screenshot**

**Base URL:** `https://your-api-domain.com`

#### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | string | ✅ Yes | - | Target website URL (must include http:// or https://) |
| `width` | integer | No | 1920 | Browser viewport width (100-3000px) |
| `height` | integer | No | 1080 | Browser viewport height (100-3000px) |
| `fullPage` | boolean | No | false | Capture full page height or just viewport |
| `format` | string | No | "png" | Image format: "png", "jpeg", "webp" |
| `waitStrategy` | string | No | "networkidle2" | Wait strategy: "load", "domcontentloaded", "networkidle0", "networkidle2" |
| `maxWaitTime` | integer | No | 10000 | Additional wait time in milliseconds (0-10000) |
| `blockResources` | boolean | No | false | Block CSS, fonts, images for faster loading |

#### Request Example

```json
{
  "url": "https://example.com",
  "width": 1920,
  "height": 1080,
  "fullPage": true,
  "format": "png",
  "waitStrategy": "networkidle2",
  "maxWaitTime": 5000,
  "blockResources": false
}
```

#### Response Format

```json
{
  "success": true,
  "screenshot": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "url": "https://example.com",
  "dimensions": {
    "width": 1920,
    "height": 1080
  },
  "fullPage": true,
  "processingTime": "3250ms",
  "settings": {
    "waitStrategy": "networkidle2",
    "maxWaitTime": 5000,
    "blockResources": false
  }
}
```

#### Error Response

```json
{
  "error": "Failed to take screenshot",
  "message": "net::ERR_NAME_NOT_RESOLVED at https://invalid-url.com"
}
```

---

### 🏥 GET /health
**API health check**

Returns API status and timestamp.

#### Response Example

```json
{
  "status": "OK",
  "timestamp": "2025-08-06T10:30:45.123Z"
}
```

---

## Usage Examples

### cURL
```bash
curl -X POST "https://your-api-domain.com/screenshot" \
  -H "Content-Type: application/json" \
  -H "X-RapidAPI-Key: YOUR_API_KEY" \
  -H "X-RapidAPI-Host: your-api-host" \
  -d '{
    "url": "https://github.com",
    "width": 1200,
    "height": 800,
    "fullPage": true
  }'
```

### JavaScript/Node.js
```javascript
const axios = require('axios');

const options = {
  method: 'POST',
  url: 'https://your-api-domain.com/screenshot',
  headers: {
    'Content-Type': 'application/json',
    'X-RapidAPI-Key': 'YOUR_API_KEY',
    'X-RapidAPI-Host': 'your-api-host'
  },
  data: {
    url: 'https://github.com',
    width: 1200,
    height: 800,
    fullPage: true,
    format: 'png'
  }
};

axios.request(options)
  .then(response => {
    console.log('Screenshot captured:', response.data.processingTime);
    // response.data.screenshot contains base64 image data
  })
  .catch(error => {
    console.error('Error:', error.response.data);
  });
```

### Python
```python
import requests
import base64

url = "https://your-api-domain.com/screenshot"

payload = {
    "url": "https://github.com",
    "width": 1200,
    "height": 800,
    "fullPage": True,
    "format": "png"
}

headers = {
    "Content-Type": "application/json",
    "X-RapidAPI-Key": "YOUR_API_KEY",
    "X-RapidAPI-Host": "your-api-host"
}

response = requests.post(url, json=payload, headers=headers)

if response.status_code == 200:
    data = response.json()
    screenshot_base64 = data['screenshot']
    # Remove data URL prefix and decode
    image_data = base64.b64decode(screenshot_base64.split(',')[1])
    
    with open('screenshot.png', 'wb') as f:
        f.write(image_data)
    
    print(f"Screenshot saved! Processing time: {data['processingTime']}")
else:
    print("Error:", response.json())
```

### PHP
```php
<?php
$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => "https://your-api-domain.com/screenshot",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_ENCODING => "",
    CURLOPT_MAXREDIRS => 10,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST => "POST",
    CURLOPT_POSTFIELDS => json_encode([
        'url' => 'https://github.com',
        'width' => 1200,
        'height' => 800,
        'fullPage' => true
    ]),
    CURLOPT_HTTPHEADER => [
        "Content-Type: application/json",
        "X-RapidAPI-Key: YOUR_API_KEY",
        "X-RapidAPI-Host: your-api-host"
    ],
]);

$response = curl_exec($curl);
$err = curl_error($curl);
curl_close($curl);

if ($err) {
    echo "cURL Error: " . $err;
} else {
    $data = json_decode($response, true);
    if ($data['success']) {
        echo "Screenshot captured in " . $data['processingTime'];
        // Save base64 image to file
        $imageData = explode(',', $data['screenshot'])[1];
        file_put_contents('screenshot.png', base64_decode($imageData));
    }
}
?>
```

---

## Use Cases

### 🎯 **Web Monitoring**
- Monitor website changes and layouts
- Automated visual regression testing
- Track competitor websites

### 📊 **Content Creation**
- Generate thumbnails for blog posts
- Create social media previews
- Build website galleries

### 🔍 **Web Scraping & Analysis**
- Visual verification of scraped content
- Website archiving
- Quality assurance testing

### 📱 **Documentation**
- Capture website states for documentation
- Create user guides with screenshots
- Build visual changelogs

---

## Response Time & Performance

| Scenario | Average Response Time |
|----------|----------------------|
| Simple website (basic HTML) | 2-3 seconds |
| Standard website (with CSS/JS) | 3-5 seconds |
| Complex website (heavy content) | 5-8 seconds |
| Full page screenshot | +1-2 seconds |

### Performance Tips
- Use `blockResources: true` for faster screenshots of text-heavy sites
- Set appropriate `maxWaitTime` based on website complexity
- Use `networkidle2` for most websites, `load` for simple pages
- Smaller dimensions process faster

---

## Rate Limits & Pricing

### Free Tier
- 100 requests/month
- Standard support

### Pro Tier
- 10,000 requests/month
- Priority processing
- Email support

### Business Tier
- 100,000 requests/month
- Fastest processing
- Dedicated support
- Custom configurations

*Note: Actual pricing will be set through RapidAPI marketplace*

---

## Error Handling

### Common Error Codes

| HTTP Status | Error Type | Description |
|-------------|------------|-------------|
| 400 | Bad Request | Missing or invalid URL parameter |
| 404 | Not Found | Invalid endpoint |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Screenshot generation failed |
| 504 | Gateway Timeout | Website took too long to load |

### Error Response Format
```json
{
  "error": "Error type",
  "message": "Detailed error description"
}
```

---

## FAQ

### Q: What image formats are supported?
**A:** PNG, JPEG, and WebP formats are supported. PNG is recommended for best quality.

### Q: What's the maximum screenshot size?
**A:** Maximum dimensions are 3000x3000 pixels. For full page screenshots, height is automatically determined.

### Q: Can I screenshot password-protected sites?
**A:** No, the API cannot authenticate with password-protected websites. Only publicly accessible URLs are supported.

### Q: How long are screenshots cached?
**A:** Screenshots are not cached. Each request generates a fresh screenshot.

### Q: What happens if a website blocks the request?
**A:** Some websites may block automated requests. The API will return an appropriate error message in such cases.

---

## Support & Documentation

- 📧 **Email Support:** Available for Pro and Business tiers
- 🐛 **Bug Reports:** Submit through RapidAPI dashboard
- 💡 **Feature Requests:** Contact support team
- 📖 **API Status:** Check health endpoint for real-time status

---

*This API is optimized for reliability, speed, and ease of integration. Perfect for developers who need consistent, high-quality website screenshots.*
