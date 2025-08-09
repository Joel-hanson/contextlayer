# Contextlayer - Deployment Guide

This guide will help you deploy your Contextlayer application to Vercel with database setup and CI/CD pipeline.

## Quick Start (5 minutes)

1. **Install Vercel CLI**

   ```bash
   npm install -g vercel@latest
   ```

2. **Run Setup Script**

   ```bash
   npm run deploy:setup
   ```

3. **Set up Database** (see Database Setup section below)

4. **Deploy**
   ```bash
   vercel --prod
   ```

## Detailed Setup

### 1. Vercel Project Setup

```bash
cd /Users/joelhanson/Desktop/Personal/contextlayer

# Login to Vercel
vercel login

# Link project to Vercel
vercel link
```

### 2. Database Setup

#### Option A: Vercel Postgres (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your project
3. Go to Storage tab
4. Click "Create Database" → "Postgres"
5. Connect to your project
6. DATABASE_URL will be automatically set

#### Option B: External Database (Cheaper for MVP)

**Supabase** (Free tier available):

```bash
# 1. Create project at supabase.com
# 2. Get connection string from Settings > Database
# 3. Add to Vercel:
vercel env add DATABASE_URL production
# Paste: postgresql://postgres:[password]@[host]:5432/postgres
```

**Neon** (Generous free tier):

```bash
# 1. Create project at neon.tech
# 2. Copy connection string
# 3. Add to Vercel:
vercel env add DATABASE_URL production
```

### 3. Environment Variables

Set these in Vercel dashboard or via CLI:

```bash
# Required variables
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production
vercel env add DATABASE_URL production

# Primary OAuth: Google (recommended)
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production

# Optional: GitHub OAuth (alternative)
vercel env add GITHUB_ID production
vercel env add GITHUB_SECRET production
```

Generate NextAuth secret:

```bash
openssl rand -base64 32
```

### 4. Authentication Setup

#### Google OAuth (Primary - Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/) > APIs & Services > Credentials
2. Create OAuth 2.0 Client ID for Web application:
   - Application name: `Contextlayer`
   - Authorized JavaScript origins: `https://your-app.vercel.app`
   - Authorized redirect URIs: `https://your-app.vercel.app/api/auth/callback/google`
3. Add Client ID and Secret to Vercel environment variables

#### GitHub OAuth (Optional - Alternative)

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create new OAuth App:
   - Application name: `Contextlayer`
   - Homepage URL: `https://your-app.vercel.app`
   - Authorization callback URL: `https://your-app.vercel.app/api/auth/callback/github`
3. Add Client ID and Secret to Vercel environment variables

### 5. Deploy

```bash
# Check readiness
npm run deploy:check

# Deploy to production
vercel --prod

# Run database migrations
npx prisma migrate deploy
```

## Dynamic URL Configuration

The application uses dynamic URL generation to work correctly in any deployment environment:

### Environment Variables

- `NEXT_PUBLIC_APP_URL`: Your application's public URL
- Development: `http://localhost:3000`
- Production: `https://your-domain.vercel.app`
- Custom domain: `https://your-custom-domain.com`

**Vercel automatically detects the correct URL, but you can override with:**

```bash
vercel env add NEXT_PUBLIC_APP_URL production
```

## Automated CI/CD

The project includes GitHub Actions workflow that will:

- Run tests on every PR
- Deploy preview environments for PRs
- Deploy to production on main branch pushes

### Setup GitHub Actions

1. Add these secrets to your GitHub repository:

   - `VERCEL_TOKEN`: Get from Vercel Dashboard > Settings > Tokens
   - `VERCEL_ORG_ID`: Get from Vercel project settings
   - `VERCEL_PROJECT_ID`: Get from Vercel project settings

2. Push to main branch to trigger deployment

## Migration Strategy (Future-Proof)

Your deployment is designed for easy migration to other platforms:

### Database Migration

```bash
# Migrate between database providers
npm run deploy:migrate-db migrate vercel supabase
npm run deploy:migrate-db migrate supabase rds

# Get setup instructions for any platform
npm run deploy:migrate-db setup neon
npm run deploy:migrate-db setup planetscale
```

### Platform Migration

The application uses standard patterns that work on any platform:

- Standard PostgreSQL (works everywhere)
- Environment variables (universal)
- Docker support (for containerized deployments)
- Next.js (runs on all major platforms)

## Monitoring and Health Checks

### Built-in Health Check

Visit `https://your-app.vercel.app/health` to see:

- Application status
- Database connectivity
- Environment configuration
- Memory usage
- Uptime

### Pre-deployment Checks

```bash
# Run health checks before deploying
npm run deploy:health

# Full deployment readiness check
npm run deploy:check
```

## Cost Optimization

### Vercel Costs

- **Free tier**: Perfect for MVP (100GB bandwidth)
- **Pro tier**: $20/month when you need more
- **Database**: $20/month (or use external free tier)

### Migration Triggers

Consider migrating when:

- Monthly costs > $50
- Need more database storage (>8GB)
- High traffic consistently
- Need custom server configurations

## Troubleshooting

### Common Issues

1. **Build Failures**

   ```bash
   # Check TypeScript errors
   npx tsc --noEmit

   # Check build locally
   npm run build
   ```

2. **Database Connection Issues**

   ```bash
   # Test database connection
   npx prisma db pull

   # Check environment variables
   vercel env ls
   ```

3. **Environment Variables**

   ```bash
   # Pull environment from Vercel
   vercel env pull .env.local

   # Test locally with production env
   npm run dev
   ```

### Getting Help

- Check deployment logs: `vercel logs`
- Run health check: `curl https://your-app.vercel.app/health`
- Review Vercel dashboard for errors
- Check GitHub Actions logs for CI/CD issues

## Production Checklist

Before going live:

- [ ] Database setup and migrations run
- [ ] All environment variables configured
- [ ] Health check returns 200 OK
- [ ] SSL certificate active (automatic with Vercel)
- [ ] Custom domain configured (optional)
- [ ] Monitoring set up
- [ ] Backup strategy in place

## Next Steps

Once deployed:

1. **Monitor usage** via Vercel analytics
2. **Set up error tracking** (Sentry recommended)
3. **Configure uptime monitoring**
4. **Plan scaling strategy** based on growth
5. **Consider CDN** for static assets (included with Vercel)

Your Contextlayer is now production-ready! 🚀
