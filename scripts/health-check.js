#!/usr/bin/env node

/**
 * Pre-deployment Health Check Script
 * Validates the application before deployment to catch issues early
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const checks = [
    {
        name: 'Environment Variables',
        check: () => {
            const required = [
                'DATABASE_URL',
                'NEXTAUTH_SECRET',
                'NEXTAUTH_URL'
            ];

            const missing = required.filter(env => !process.env[env]);
            return missing.length === 0
                ? { status: 'PASS', message: 'All required env vars present' }
                : { status: 'FAIL', message: `Missing: ${missing.join(', ')}` };
        }
    },
    {
        name: 'Package Dependencies',
        check: () => {
            try {
                const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
                const lockFile = fs.existsSync('package-lock.json');

                if (!lockFile) {
                    return { status: 'WARN', message: 'No package-lock.json found' };
                }

                return { status: 'PASS', message: `${Object.keys(packageJson.dependencies || {}).length} dependencies` };
            } catch (error) {
                return { status: 'FAIL', message: error.message };
            }
        }
    },
    {
        name: 'Prisma Schema',
        check: () => {
            try {
                const schemaExists = fs.existsSync('prisma/schema.prisma');
                if (!schemaExists) {
                    return { status: 'FAIL', message: 'No Prisma schema found' };
                }

                // Check if migrations exist
                const migrationsDir = 'prisma/migrations';
                const hasMigrations = fs.existsSync(migrationsDir) &&
                    fs.readdirSync(migrationsDir).length > 0;

                return {
                    status: 'PASS',
                    message: hasMigrations ? 'Schema and migrations ready' : 'Schema ready (no migrations)'
                };
            } catch (error) {
                return { status: 'FAIL', message: error.message };
            }
        }
    },
    {
        name: 'Build Process',
        check: () => {
            try {
                console.log('  Building application...');
                execSync('npm run build', { stdio: 'pipe' });

                // Check if .next directory was created
                const buildExists = fs.existsSync('.next');
                return buildExists
                    ? { status: 'PASS', message: 'Build successful' }
                    : { status: 'FAIL', message: 'Build directory not created' };
            } catch (error) {
                return { status: 'FAIL', message: `Build failed: ${error.message}` };
            }
        }
    },
    {
        name: 'TypeScript Validation',
        check: () => {
            try {
                execSync('npx tsc --noEmit', { stdio: 'pipe' });
                return { status: 'PASS', message: 'No TypeScript errors' };
            } catch (error) {
                const output = error.stdout?.toString() || error.message;
                const errorCount = (output.match(/error TS/g) || []).length;
                return {
                    status: 'FAIL',
                    message: `${errorCount} TypeScript errors found`
                };
            }
        }
    },
    {
        name: 'Vercel Configuration',
        check: () => {
            try {
                const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
                const hasEnvVars = vercelConfig.env && Object.keys(vercelConfig.env).length > 0;

                return {
                    status: 'PASS',
                    message: hasEnvVars ? 'Vercel config ready' : 'Basic config present'
                };
            } catch (error) {
                return { status: 'WARN', message: 'No vercel.json found' };
            }
        }
    }
];

async function runHealthCheck() {
    console.log('🔍 Pre-deployment Health Check\n');
    console.log('==========================================\n');

    let passed = 0;
    let failed = 0;
    let warnings = 0;

    for (const { name, check } of checks) {
        process.stdout.write(`Checking ${name}... `);

        try {
            const result = check();
            const emoji = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️' : '❌';

            console.log(`${emoji} ${result.status}: ${result.message}`);

            if (result.status === 'PASS') passed++;
            else if (result.status === 'WARN') warnings++;
            else failed++;

        } catch (error) {
            console.log(`❌ FAIL: ${error.message}`);
            failed++;
        }
    }

    console.log('\n==========================================');
    console.log(`Results: ${passed} passed, ${warnings} warnings, ${failed} failed\n`);

    if (failed > 0) {
        console.log('❌ Deployment not recommended. Please fix the failing checks.');
        process.exit(1);
    } else if (warnings > 0) {
        console.log('⚠️  Deployment possible but with warnings. Review before proceeding.');
    } else {
        console.log('🎉 All checks passed! Ready for deployment.');
    }

    console.log('\n📋 Next steps:');
    console.log('1. Run: vercel --prod');
    console.log('2. Set up database: npx prisma migrate deploy');
    console.log('3. Verify deployment: curl https://your-app.vercel.app/health');
}

runHealthCheck().catch(console.error);
