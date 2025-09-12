# OAuth Setup Guide for Contextlayer

## Google OAuth (Primary Authentication)

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API (if not already enabled)

### 2. Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** > **Credentials**
2. Click **"+ CREATE CREDENTIALS"** > **"OAuth 2.0 Client IDs"**
3. Choose **"Web application"** as application type
4. Configure the OAuth client:
   - **Name**: `Contextlayer`
   - **Authorized JavaScript origins**:
     - Development: `http://localhost:3000`
     - Production: `https://your-domain.vercel.app`
   - **Authorized redirect URIs**:
     - Development: `http://localhost:3000/api/auth/callback/google`
     - Production: `https://your-domain.vercel.app/api/auth/callback/google`

### 3. Add to Vercel Environment Variables

```bash
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production

# Also add for preview and development environments
vercel env add GOOGLE_CLIENT_ID preview
vercel env add GOOGLE_CLIENT_SECRET preview
vercel env add GOOGLE_CLIENT_ID development
vercel env add GOOGLE_CLIENT_SECRET development
```

---

## GitHub OAuth (Alternative Authentication)

### 1. Create GitHub OAuth App

1. Go to [GitHub Settings](https://github.com/settings/profile) > **Developer settings** > **OAuth Apps**
2. Click **"New OAuth App"**
3. Fill in the application details:
   - **Application name**: `Contextlayer`
   - **Homepage URL**: `https://your-domain.vercel.app`
   - **Application description**: `Transform REST APIs into MCP servers`
   - **Authorization callback URL**: `https://your-domain.vercel.app/api/auth/callback/github`

### 2. Add to Vercel Environment Variables

```bash
vercel env add GITHUB_ID production
vercel env add GITHUB_SECRET production

# Also add for preview and development environments
vercel env add GITHUB_ID preview
vercel env add GITHUB_SECRET preview
vercel env add GITHUB_ID development
vercel env add GITHUB_SECRET development
```

---

## Testing OAuth Configuration

### Local Development

1. Copy environment variables to `.env.local`:

```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret
```

2. Test the authentication flow:

```bash
npm run dev
# Visit http://localhost:3000
# Try signing in with Google (primary)
# Try signing in with GitHub (alternative)
```

### Production Deployment

1. Ensure all environment variables are set in Vercel
2. Deploy: `vercel --prod`
3. Test authentication on your live site
4. Check health endpoint: `https://your-domain.vercel.app/health`

---

## Environment Variables Summary

| Variable               | Required    | Purpose             | Where to Get                            |
| ---------------------- | ----------- | ------------------- | --------------------------------------- |
| `GOOGLE_CLIENT_ID`     | Recommended | Google OAuth        | Google Cloud Console                    |
| `GOOGLE_CLIENT_SECRET` | Recommended | Google OAuth        | Google Cloud Console                    |
| `GITHUB_ID`            | Optional    | GitHub OAuth        | GitHub Developer Settings               |
| `GITHUB_SECRET`        | Optional    | GitHub OAuth        | GitHub Developer Settings               |
| `NEXTAUTH_SECRET`      | Required    | Session signing     | Generate with `openssl rand -base64 32` |
| `DATABASE_URL`         | Required    | Database connection | Vercel Postgres or external provider    |

---

## Troubleshooting

### Common Issues

1. **"OAuth app not found"**

   - Check that callback URLs exactly match your domain
   - Ensure OAuth app is not in draft/review state

2. **"Invalid redirect URI"**

   - Verify redirect URIs include `/api/auth/callback/provider`
   - Check for typos in domain names

3. **"Access denied"**
   - Confirm OAuth app has correct permissions
   - Check that environment variables are properly set

### Testing OAuth Flow

```bash
# Check if environment variables are loaded
curl https://your-domain.vercel.app/health

# Test OAuth endpoints
curl https://your-domain.vercel.app/api/auth/providers
```

Your Contextlayer now supports both Google (primary) and GitHub (alternative) authentication! 🎉
