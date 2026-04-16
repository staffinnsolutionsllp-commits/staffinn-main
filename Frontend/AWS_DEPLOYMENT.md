# AWS S3 + CloudFront Deployment Configuration

## Problem
When deploying a React SPA (Single Page Application) to AWS S3 with CloudFront, page reloads on routes other than `/` result in 404 errors or redirect to home page.

## Solution

### 1. CloudFront Error Pages Configuration

Add custom error responses in CloudFront distribution:

**For 403 Forbidden:**
- HTTP Error Code: 403
- Error Caching Minimum TTL: 0
- Customize Error Response: Yes
- Response Page Path: /index.html
- HTTP Response Code: 200

**For 404 Not Found:**
- HTTP Error Code: 404
- Error Caching Minimum TTL: 0
- Customize Error Response: Yes
- Response Page Path: /index.html
- HTTP Response Code: 200

### 2. S3 Bucket Configuration

In S3 bucket properties > Static website hosting:
- Index document: index.html
- Error document: index.html

### 3. Build and Deploy

```bash
# Build the project
npm run build

# Deploy to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## How It Works

1. User visits `/dashboard/institute` directly or reloads the page
2. CloudFront/S3 tries to find a file at that path
3. File doesn't exist, returns 403/404
4. CloudFront catches the error and serves `/index.html` with 200 status
5. React Router takes over and renders the correct component
6. User stays on `/dashboard/institute` instead of being redirected to `/`

## Additional Notes

- The `_redirects` file is for Netlify
- The `vercel.json` file is for Vercel
- For AWS, use CloudFront error pages configuration
- Make sure to invalidate CloudFront cache after each deployment
