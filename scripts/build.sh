#!/bin/bash

# Vercel build script for Contextlayer
echo "Starting build process..."

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Build Next.js app  
echo "Building Next.js application..."
npx next build

echo "Build completed successfully!"
