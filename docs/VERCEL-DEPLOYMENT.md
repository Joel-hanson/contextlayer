# ContextLayer - Clean Vercel Deployment Guide

## 🎯 **The Simple Way (Vercel Best Practices)**

This guide follows Vercel's recommended patterns for Next.js + Prisma deployment.

### 1. **Local Development Setup**

```bash
# Clone and setup
git clone <your-repo>
cd contextlayer
npm install

# Setup environment (already done - you have .env.local!)
# Just verify your .env.local has correct database URL and OAuth keys

# Setup database
npm run db:generate
npm run db:push
npm run db:seed

# Start development
npm run dev
```

### 2. **Production Deployment**

#### Option A: Git Integration (Recommended)

1. Connect your GitHub repo to Vercel dashboard
2. Set environment variables in Vercel dashboard
3. Push to main branch → auto-deploy ✨

#### Option B: CLI Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### 3. **Environment Variables Setup**

Set these in **Vercel Dashboard → Project → Settings → Environment Variables**:

```bash
# Database (from Vercel Postgres)
DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=...
DIRECT_DATABASE_URL=postgres://user:pass@host:port/db

# Auth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-app.vercel.app
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 4. **Database Setup**

#### First Deployment

```bash
# After first deploy, initialize database
vercel env pull .env.production
npm run prod:migrate
npm run db:seed-prod
```

#### Subsequent Deployments

- Database migrates automatically via `postinstall` script
- No manual intervention needed

---

## 🧹 **What We're Removing**

- ❌ Complex GitHub Actions workflow
- ❌ Custom deployment scripts
- ❌ Multiple configuration files
- ❌ Manual setup processes

## ✅ **What We're Keeping**

- ✅ Simple `vercel.json` configuration
- ✅ Standard Next.js build process
- ✅ Prisma migrations in `postinstall`
- ✅ Production seeding script
- ✅ Health check endpoint

---

## 📋 **Complete Setup Checklist**

### Local Development

- [ ] `npm install`
- [ ] Setup `.env.local`
- [ ] `npx prisma db push`
- [ ] `npm run db:seed`
- [ ] `npm run dev`

### Production Deployment

- [ ] Connect GitHub to Vercel
- [ ] Add environment variables in Vercel dashboard
- [ ] Push to main branch
- [ ] Run database setup (one-time)
- [ ] Test your app!

### Demo Data

- [ ] Login with: `demo@contextlayer.com` / `demo123!`
- [ ] Test sample bridges
- [ ] Create your own bridges

---

## 🎉 **That's It!**

This follows Vercel's conventions exactly:

- Git-based deployments
- Environment variables in dashboard
- Standard Next.js build process
- Minimal configuration
- Zero custom deployment logic

**Result**: Deploy with `git push` - everything else is automatic! ✨
