#!/usr/bin/env node

/**
 * Prisma Build Script for Vercel
 * This script ensures Prisma Client is generated during the build process
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Starting Prisma build process...');

try {
    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
        console.log('⚠️  DATABASE_URL not found in environment variables');
        console.log('   This is expected during build time on Vercel');
    } else {
        console.log('✅ DATABASE_URL found in environment');
    }

    // Check if Prisma schema exists
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    if (!fs.existsSync(schemaPath)) {
        throw new Error('Prisma schema file not found at prisma/schema.prisma');
    }
    console.log('✅ Prisma schema found');

    // Generate Prisma Client
    console.log('🔄 Generating Prisma Client...');
    execSync('npx prisma generate', {
        stdio: 'inherit',
        env: {
            ...process.env,
            PRISMA_GENERATE_DATAPROXY: 'true'
        }
    });
    console.log('✅ Prisma Client generated successfully');

    // Check if client was generated
    const clientPath = path.join(process.cwd(), 'node_modules', '.prisma', 'client');
    if (fs.existsSync(clientPath)) {
        console.log('✅ Prisma Client files verified');
    } else {
        console.log('⚠️  Prisma Client files not found in expected location');
    }

    console.log('🎉 Prisma build process completed successfully');

} catch (error) {
    console.error('❌ Prisma build process failed:', error.message);
    process.exit(1);
}
