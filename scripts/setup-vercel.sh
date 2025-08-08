#!/bin/bash

# MCP Bridge - Vercel Deployment Setup Script
# This script sets up your project for Vercel deployment

set -e

echo "🚀 Setting up MCP Bridge for Vercel deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this script from the project root."
    exit 1
fi

# Install Vercel CLI if not present
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel@latest
fi

# Login to Vercel
echo "🔑 Please log in to Vercel..."
vercel login

# Initialize Vercel project
echo "🏗️  Setting up Vercel project..."
vercel link

# Set up environment variables
echo "⚙️  Setting up environment variables..."

# Generate NextAuth secret if not provided
if [ -z "$NEXTAUTH_SECRET" ]; then
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    echo "🔐 Generated NEXTAUTH_SECRET: $NEXTAUTH_SECRET"
fi

# Set environment variables in Vercel
echo "📝 Setting environment variables in Vercel..."

# Production environment variables
vercel env add NEXTAUTH_SECRET production <<< "$NEXTAUTH_SECRET"
vercel env add NEXTAUTH_URL production <<< "https://your-domain.vercel.app"

# Preview environment variables
vercel env add NEXTAUTH_SECRET preview <<< "$NEXTAUTH_SECRET"
vercel env add NEXTAUTH_URL preview <<< "https://your-branch-hash.vercel.app"

# Development environment variables
vercel env add NEXTAUTH_SECRET development <<< "$NEXTAUTH_SECRET"
vercel env add NEXTAUTH_URL development <<< "http://localhost:3000"

echo "✅ Basic setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set up Vercel Postgres database:"
echo "   - Go to your Vercel dashboard"
echo "   - Navigate to Storage > Create Database > Postgres"
echo "   - Connect it to your project"
echo ""
echo "2. Set up Google OAuth (Primary authentication):"
echo "   - Go to Google Cloud Console > APIs & Services > Credentials"
echo "   - Create OAuth 2.0 Client ID for Web application"
echo "   - Authorized redirect URIs: https://your-domain.vercel.app/api/auth/callback/google"
echo "   - Add the Client ID and Secret to Vercel env vars:"
echo "   - vercel env add GOOGLE_CLIENT_ID production"
echo "   - vercel env add GOOGLE_CLIENT_SECRET production"
echo ""
echo "3. Optional: Set up GitHub OAuth (Alternative authentication):"
echo "   - Go to GitHub Settings > Developer settings > OAuth Apps"
echo "   - Create a new OAuth App"
echo "   - Authorization callback URL: https://your-domain.vercel.app/api/auth/callback/github"
echo "   - Add the Client ID and Secret to Vercel env vars:"
echo "   - vercel env add GITHUB_ID production"
echo "   - vercel env add GITHUB_SECRET production"
echo ""
echo "4. Deploy your application:"
echo "   - vercel --prod"
echo ""
echo "🎉 Your MCP Bridge is ready for deployment!"
