#!/bin/bash
# ContextLayer - One-time Production Setup Script

echo "🚀 Setting up ContextLayer production database..."

# Check if we can pull environment variables from Vercel
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Please install it first:"
    echo "   npm install -g vercel@latest"
    exit 1
fi

echo "Pulling production environment variables..."
vercel env pull .env.vercel --environment=production

# Check if DATABASE_URL exists in the pulled file
if ! grep -q "DATABASE_URL" .env.vercel; then
    echo "❌ DATABASE_URL not found in production environment."
    echo "   Please set your environment variables in Vercel dashboard:"
    echo "   https://vercel.com/dashboard → Project → Settings → Environment Variables"
    exit 1
fi

echo "Generating Prisma client..."
dotenv -e .env.vercel -- npx prisma generate --no-engine

echo "Running database migrations..."
dotenv -e .env.vercel -- npx prisma migrate deploy

echo "Seeding with demo data..."
dotenv -e .env.vercel -- npm run db:seed

echo "Setup complete! Your ContextLayer is ready."
echo ""
echo "🧪 Demo Login:"
echo "   Email: test@example.com"
echo "   Password: password123"

# Cleanup temporary file
rm -f .env.vercel
