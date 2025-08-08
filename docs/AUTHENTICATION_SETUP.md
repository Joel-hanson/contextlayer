# Authentication Setup Guide

The current bridge creation error is due to missing user authentication. Here are the solutions:

## Current Development Solution ✅

I've updated the `/api/bridges` route to automatically create a development user when no session exists. This allows you to create bridges without setting up full authentication.

## For Production Setup

### 1. Set up NextAuth properly in `src/lib/auth.ts`

### 2. Configure your authentication providers

### 3. Ensure users are created in the database when they sign up

## Database Migration Required

The migration added a required `userId` column to bridges. Make sure to:

1. **Run the migration**:

   ```bash
   npx prisma migrate deploy
   ```

2. **If you have existing bridges without userId**, update them:

   ```sql
   -- Get the default user ID first
   SELECT id FROM users WHERE email = 'dev@example.com';

   -- Update existing bridges (replace <user-id> with actual ID)
   UPDATE bridges SET "userId" = '<user-id>' WHERE "userId" IS NULL;
   ```

## Development Mode Features

- ✅ Automatically creates a default user (`dev@example.com`)
- ✅ All bridge operations work without authentication
- ✅ Maintains database relationships

## Production Mode

When deploying, either:

1. Remove the development user creation logic
2. Or add proper environment checks (`NODE_ENV !== 'production'`)
