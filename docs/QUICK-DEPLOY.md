# Quick Deployment to Vercel

## 1-Minute Setup

```bash
# Install Vercel CLI
npm install -g vercel@latest

# Deploy (will prompt for configuration)
vercel --prod

# Set up database at vercel.com/dashboard (Storage > Create Database > Postgres)
# Environment variables are set automatically by Vercel
```

## Environment Variables Needed

- `DATABASE_URL`: Set automatically by Vercel Postgres
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: Set automatically by Vercel
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: For Google OAuth (primary auth)
- `GITHUB_ID` & `GITHUB_SECRET`: Optional, for GitHub OAuth (alternative auth)

## Complete Guide

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full setup instructions, database options, CI/CD, and migration strategies.

## Health Check

After deployment, visit: `https://your-app.vercel.app/health`
