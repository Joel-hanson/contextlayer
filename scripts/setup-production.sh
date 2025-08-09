#!/bin/bash
# MCP Bridge - One-time Production Setup Script

echo "🚀 Setting up MCP Bridge production database..."

# Check if we can pull environment variables from Vercel
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Please install it first:"
    echo "   npm install -g vercel@latest"
    exit 1
fi

echo "1️⃣ Pulling production environment variables..."
vercel env pull .env.production --environment=production

# Check if DATABASE_URL exists in the pulled file
if ! grep -q "DATABASE_URL" .env.production; then
    echo "❌ DATABASE_URL not found in production environment."
    echo "   Please set your environment variables in Vercel dashboard:"
    echo "   https://vercel.com/dashboard → Project → Settings → Environment Variables"
    exit 1
fi

echo "2️⃣ Generating Prisma client..."
dotenv -e .env.production -- npx prisma generate

echo "3️⃣ Running database migrations..."
dotenv -e .env.production -- npx prisma migrate deploy

echo "4️⃣ Seeding with demo data..."
dotenv -e .env.production -- npm run db:seed-prod

echo "✅ Setup complete! Your MCP Bridge is ready."
echo ""
echo "🧪 Demo Login:"
echo "   Email: demo@mcpbridge.com"
echo "   Password: demo123!"

# Cleanup temporary file
rm -f .env.production
