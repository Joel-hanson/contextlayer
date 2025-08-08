#!/usr/bin/env node

/**
 * Database Migration Script for Platform Changes
 * Supports migration between different database providers
 */

const { execSync } = require('child_process');

const platforms = {
    vercel: {
        name: 'Vercel Postgres',
        setup: () => {
            console.log('Setting up Vercel Postgres...');
            console.log('1. Go to Vercel Dashboard > Storage');
            console.log('2. Create Postgres database');
            console.log('3. Connect to your project');
            console.log('4. DATABASE_URL will be automatically set');
        }
    },
    supabase: {
        name: 'Supabase',
        setup: () => {
            console.log('Setting up Supabase...');
            console.log('1. Create project at supabase.com');
            console.log('2. Get connection string from Settings > Database');
            console.log('3. Set DATABASE_URL environment variable');
        }
    },
    planetscale: {
        name: 'PlanetScale',
        setup: () => {
            console.log('Setting up PlanetScale...');
            console.log('1. Create database at planetscale.com');
            console.log('2. Create connection string');
            console.log('3. Update Prisma schema for MySQL');
            console.log('4. Set DATABASE_URL environment variable');
        }
    },
    neon: {
        name: 'Neon',
        setup: () => {
            console.log('Setting up Neon...');
            console.log('1. Create project at neon.tech');
            console.log('2. Get connection string');
            console.log('3. Set DATABASE_URL environment variable');
        }
    },
    rds: {
        name: 'AWS RDS',
        setup: () => {
            console.log('Setting up AWS RDS...');
            console.log('1. Create RDS PostgreSQL instance');
            console.log('2. Configure security groups');
            console.log('3. Set DATABASE_URL environment variable');
        }
    }
};

function migrateDatabase(from, to) {
    console.log(`🔄 Migrating from ${platforms[from]?.name || from} to ${platforms[to]?.name || to}`);

    const sourceUrl = process.env.SOURCE_DATABASE_URL;
    const targetUrl = process.env.TARGET_DATABASE_URL;

    if (!sourceUrl || !targetUrl) {
        console.error('❌ Please set SOURCE_DATABASE_URL and TARGET_DATABASE_URL environment variables');
        process.exit(1);
    }

    try {
        // 1. Backup source database
        console.log('📦 Creating backup of source database...');
        execSync(`pg_dump "${sourceUrl}" > migration-backup-${Date.now()}.sql`, { stdio: 'inherit' });

        // 2. Run migrations on target
        console.log('🔧 Running Prisma migrations on target database...');
        process.env.DATABASE_URL = targetUrl;
        execSync('npx prisma migrate deploy', { stdio: 'inherit' });

        // 3. Import data
        console.log('📥 Importing data to target database...');
        execSync(`psql "${targetUrl}" < migration-backup-*.sql`, { stdio: 'inherit' });

        // 4. Verify migration
        console.log('✅ Verifying migration...');
        execSync('npx prisma db pull', { stdio: 'inherit' });

        console.log('🎉 Migration completed successfully!');
        console.log('📋 Next steps:');
        console.log('1. Update your environment variables');
        console.log('2. Deploy your application');
        console.log('3. Test thoroughly before switching traffic');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.log('🔧 Troubleshooting:');
        console.log('1. Check database connection strings');
        console.log('2. Ensure databases are accessible');
        console.log('3. Verify Prisma schema compatibility');
        process.exit(1);
    }
}

function showPlatformSetup(platform) {
    const config = platforms[platform];
    if (!config) {
        console.error(`❌ Unknown platform: ${platform}`);
        console.log(`Available platforms: ${Object.keys(platforms).join(', ')}`);
        process.exit(1);
    }

    console.log(`🚀 Setting up ${config.name}:\n`);
    config.setup();
}

// CLI Interface
const command = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];

switch (command) {
    case 'migrate':
        if (!arg1 || !arg2) {
            console.error('Usage: node database-migration.js migrate <from> <to>');
            console.log(`Available platforms: ${Object.keys(platforms).join(', ')}`);
            process.exit(1);
        }
        migrateDatabase(arg1, arg2);
        break;

    case 'setup':
        if (!arg1) {
            console.error('Usage: node database-migration.js setup <platform>');
            console.log(`Available platforms: ${Object.keys(platforms).join(', ')}`);
            process.exit(1);
        }
        showPlatformSetup(arg1);
        break;

    case 'list':
        console.log('📋 Available database platforms:\n');
        Object.entries(platforms).forEach(([key, config]) => {
            console.log(`  ${key.padEnd(12)} - ${config.name}`);
        });
        break;

    default:
        console.log('🗄️  MCP Bridge Database Migration Tool\n');
        console.log('Commands:');
        console.log('  migrate <from> <to>  - Migrate between platforms');
        console.log('  setup <platform>     - Show setup instructions');
        console.log('  list                 - List available platforms');
        console.log('\nExample:');
        console.log('  node database-migration.js migrate vercel rds');
        console.log('  node database-migration.js setup supabase');
}
