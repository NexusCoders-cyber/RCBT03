# Render Deployment Guide for JAMB CBT Application

This guide explains how to deploy the JAMB CBT application on Render.

## Option 1: Deploy as Static Site (Frontend Only)

If you only need the frontend without the backend API, deploy as a static site.

### Build Settings

| Setting | Value |
|---------|-------|
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |
| **Node Version** | 20 |

### Environment Variables

No environment variables are required for static deployment.

### Steps

1. Connect your GitHub repository to Render
2. Select "Static Site" as the type
3. Set the Root Directory to `cbt-app`
4. Enter the build command: `npm install && npm run build`
5. Set the publish directory to `dist`
6. Click "Create Static Site"

---

## Option 2: Deploy as Web Service (Full Stack)

For the complete application with backend API support.

### Build Settings

| Setting | Value |
|---------|-------|
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `node server/index.js` |
| **Node Version** | 20 |

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `3001` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |

### Steps

1. Connect your GitHub repository to Render
2. Select "Web Service" as the type
3. Set the Root Directory to `cbt-app`
4. Enter the build command: `npm install && npm run build`
5. Enter the start command: `node server/index.js`
6. Add the required environment variables
7. Click "Create Web Service"

---

## Option 3: Deploy with render.yaml (Recommended)

Create a `render.yaml` file in your repository root for automated deployments.

### For Static Site

```yaml
services:
  - type: web
    name: jamb-cbt-app
    env: static
    buildCommand: cd cbt-app && npm install && npm run build
    staticPublishPath: cbt-app/dist
    headers:
      - path: /*
        name: Cache-Control
        value: no-cache
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

### For Full Stack Application

```yaml
services:
  - type: web
    name: jamb-cbt-backend
    env: node
    buildCommand: cd cbt-app && npm install && npm run build
    startCommand: cd cbt-app && node server/index.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
      - key: DATABASE_URL
        fromDatabase:
          name: jamb-cbt-db
          property: connectionString

databases:
  - name: jamb-cbt-db
    plan: free
    databaseName: jamb_cbt
```

---

## Post-Deployment Configuration

### Custom Domain

1. Go to your service settings in Render
2. Click "Custom Domains"
3. Add your domain (e.g., jamb-cbt.yourdomain.com)
4. Update your DNS records as instructed

### HTTPS

HTTPS is automatically enabled for all Render deployments.

### Caching

The application uses client-side caching with service workers. For optimal performance:

- Static assets are cached for 1 year
- HTML files are not cached (no-cache)
- API responses use standard HTTP caching

---

## Troubleshooting

### Build Failures

1. Check the Node.js version matches your local development
2. Ensure all dependencies are in package.json
3. Check for missing environment variables

### 404 Errors on Routes

For SPAs, ensure the rewrite rule is configured:

```yaml
routes:
  - type: rewrite
    source: /*
    destination: /index.html
```

### API Connection Issues

1. Verify the backend service is running
2. Check CORS settings in server/index.js
3. Ensure environment variables are correctly set

---

## Performance Tips

1. Enable automatic PR previews for testing
2. Use Render's auto-scaling for production
3. Set up health check endpoint at `/api/health`
4. Monitor with Render's built-in metrics

---

## Cost Considerations

| Plan | Static Site | Web Service |
|------|-------------|-------------|
| Free | Yes | Yes (750 hours/month) |
| Starter | $0.40/month | $7/month |
| Pro | Custom | Custom |

For most CBT applications, the free tier is sufficient for development and small-scale testing.
