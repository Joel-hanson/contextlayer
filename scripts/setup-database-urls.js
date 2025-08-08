#!/usr/bin/env node

/**
 * Database URL Setup Script
 * Handles fallback logic for DATABASE_URL and DIRECT_DATABASE_URL
 */

console.log('🔧 Setting up database URLs with fallback logic...');

// Get environment variables
const DATABASE_URL = process.env.DATABASE_URL;
const DIRECT_DATABASE_URL = process.env.DIRECT_DATABASE_URL;
const POSTGRES_URL = process.env.POSTGRES_URL;
const PRISMA_DATABASE_URL = process.env.PRISMA_DATABASE_URL;

console.log('Current environment variables:');
console.log(`DATABASE_URL: ${DATABASE_URL ? '✅ Set' : '❌ Not set'}`);
console.log(`DIRECT_DATABASE_URL: ${DIRECT_DATABASE_URL ? '✅ Set' : '❌ Not set'}`);
console.log(`POSTGRES_URL: ${POSTGRES_URL ? '✅ Set' : '❌ Not set'}`);
console.log(`PRISMA_DATABASE_URL: ${PRISMA_DATABASE_URL ? '✅ Set' : '❌ Not set'}`);

// Determine the correct URLs to use
let finalDatabaseUrl = DATABASE_URL;
let finalDirectUrl = DIRECT_DATABASE_URL;

// If we have PRISMA_DATABASE_URL, use it as the main DATABASE_URL
if (PRISMA_DATABASE_URL && (!DATABASE_URL || !DATABASE_URL.startsWith('prisma'))) {
    console.log('🔄 Using PRISMA_DATABASE_URL as DATABASE_URL');
    finalDatabaseUrl = PRISMA_DATABASE_URL;
    process.env.DATABASE_URL = PRISMA_DATABASE_URL;
}

// If DIRECT_DATABASE_URL is not set, try to use POSTGRES_URL or DATABASE_URL
if (!DIRECT_DATABASE_URL) {
    if (POSTGRES_URL) {
        console.log('🔄 Using POSTGRES_URL as DIRECT_DATABASE_URL fallback');
        finalDirectUrl = POSTGRES_URL;
        process.env.DIRECT_DATABASE_URL = POSTGRES_URL;
    } else if (DATABASE_URL && DATABASE_URL.startsWith('postgres')) {
        console.log('🔄 Using DATABASE_URL as DIRECT_DATABASE_URL fallback');
        finalDirectUrl = DATABASE_URL;
        process.env.DIRECT_DATABASE_URL = DATABASE_URL;
    }
}

// Validate URL formats
if (finalDatabaseUrl) {
    if (finalDatabaseUrl.startsWith('prisma://') || finalDatabaseUrl.startsWith('prisma+postgres://')) {
        console.log('✅ DATABASE_URL is using Prisma connection pooling');
    } else if (finalDatabaseUrl.includes('pgbouncer=true')) {
        console.log('✅ DATABASE_URL is using PgBouncer connection pooling');
    } else {
        console.log('⚠️  DATABASE_URL might not be using connection pooling');
    }
}

if (finalDirectUrl) {
    if (finalDirectUrl.startsWith('postgres://') || finalDirectUrl.startsWith('postgresql://')) {
        console.log('✅ DIRECT_DATABASE_URL is a valid PostgreSQL URL');
    } else {
        console.log('⚠️  DIRECT_DATABASE_URL format might be incorrect');
    }
}

console.log('\nFinal configuration:');
console.log(`DATABASE_URL: ${finalDatabaseUrl ? 'Configured' : 'Missing'}`);
console.log(`DIRECT_DATABASE_URL: ${finalDirectUrl ? 'Configured' : 'Missing'}`);

if (!finalDatabaseUrl) {
    console.error('❌ DATABASE_URL is required but not set');
    process.exit(1);
}

if (!finalDirectUrl) {
    console.warn('⚠️  DIRECT_DATABASE_URL not set - some Prisma operations may fail');
}

console.log('🎉 Database URL setup completed successfully');
