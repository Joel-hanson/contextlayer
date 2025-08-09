# Development Setup Guide

> **Document Version**: 1.0  
> **Last Updated**: August 4, 2025

## Prerequisites

Before setting up the Contextlayer development environment, ensure you have the following installed:

### Required Software

| Software | Version | Purpose             |
| -------- | ------- | ------------------- |
| Node.js  | 18.0+   | Runtime environment |
| npm      | 9.0+    | Package manager     |
| Git      | 2.0+    | Version control     |

### Recommended Tools

| Tool                     | Purpose                               |
| ------------------------ | ------------------------------------- |
| VS Code                  | IDE with excellent TypeScript support |
| Thunder Client / Postman | API testing                           |
| PostgreSQL               | Database (for production features)    |
| Redis                    | Caching (for production features)     |

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/contextlayer.git
cd contextlayer
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Application
NODE_ENV=development
PORT=3000

# Database (when implemented)
DATABASE_URL=postgresql://username:password@localhost:5432/contextlayer

# Redis (when implemented)
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-jwt-secret-here
ENCRYPTION_KEY=your-encryption-key-here

# MCP Configuration
MCP_SERVER_PORT_RANGE_START=3000
MCP_SERVER_PORT_RANGE_END=4000

# Logging
LOG_LEVEL=debug
```

### 4. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Project Structure Deep Dive

```
contextlayer/
├── docs/                      # Documentation
│   ├── README.md
│   ├── user-journey-analysis.md
│   ├── technical-architecture.md
│   └── api-reference.md
├── public/                    # Static assets
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/              # API routes
│   │   │   └── bridges/      # Bridge management endpoints
│   │   │       └── [id]/
│   │   │           ├── start/
│   │   │           └── stop/
│   │   ├── dashboard/        # Dashboard pages
│   │   │   ├── bridges/      # Bridge management UI
│   │   │   ├── docs/         # Documentation UI
│   │   │   └── layout.tsx    # Dashboard layout wrapper
│   │   ├── globals.css       # Global styles
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Landing page
│   ├── components/           # React components
│   │   ├── ui/              # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   ├── BridgeForm.tsx   # Bridge configuration form
│   │   └── DashboardLayout.tsx # Dashboard sidebar
│   └── lib/                 # Utilities and business logic
│       ├── types.ts         # TypeScript type definitions
│       ├── contextlayer.ts    # Contextlayer implementation
│       └── utils.ts         # Utility functions
├── .env.example             # Environment variables template
├── .gitignore
├── components.json          # shadcn/ui configuration
├── next.config.ts           # Next.js configuration
├── package.json
├── postcss.config.mjs       # PostCSS configuration
├── tailwind.config.js       # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

## Development Workflow

### Code Style and Quality

The project uses several tools to maintain code quality:

#### TypeScript Configuration

- Strict mode enabled
- Path mapping for clean imports
- ESNext target for modern JavaScript features

#### Linting and Formatting

```bash
# Check for linting errors
npm run lint

# Fix linting errors automatically
npm run lint:fix

# Format code (when Prettier is added)
npm run format
```

#### Type Checking

```bash
# Run TypeScript type checking
npx tsc --noEmit
```

### Git Workflow

#### Branch Naming Convention

```
feature/brief-description-of-feature
bugfix/brief-description-of-bug
hotfix/brief-description-of-hotfix
docs/brief-description-of-documentation
```

#### Commit Message Convention

Follow conventional commits format:

```
type(scope): description

feat(bridge): add real MCP server implementation
fix(api): handle bridge startup errors properly
docs(readme): update installation instructions
refactor(types): simplify bridge configuration types
```

### Testing Strategy

#### Current Testing Setup

- No automated tests currently implemented

#### Planned Testing Strategy

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

#### Testing Framework (Planned)

- **Jest**: Unit testing framework
- **React Testing Library**: Component testing
- **Playwright**: End-to-end testing
- **MSW**: API mocking for tests

## Database Setup (For Future Development)

### PostgreSQL Setup

#### Local Installation

```bash
# macOS (using Homebrew)
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# Create database
createdb contextlayer_dev
```

#### Database Migrations (Planned)

```bash
# Install Prisma CLI
npm install -g prisma

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npx prisma db seed
```

### Redis Setup (Optional)

```bash
# macOS (using Homebrew)
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis-server
```

## Environment-Specific Configuration

### Development Environment

```env
NODE_ENV=development
DEBUG=contextlayer:*
LOG_LEVEL=debug
ENABLE_MOCK_DATA=true
```

### Staging Environment

```env
NODE_ENV=staging
LOG_LEVEL=info
ENABLE_ANALYTICS=true
```

### Production Environment

```env
NODE_ENV=production
LOG_LEVEL=warn
ENABLE_ANALYTICS=true
ENABLE_MONITORING=true
```

## Debugging

### Development Server Debugging

#### VS Code Debugging Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

#### Console Debugging

```typescript
// Use debug levels for different types of output
console.debug("Detailed debugging information");
console.info("General information");
console.warn("Warning messages");
console.error("Error messages");

// Use structured logging (planned)
import { logger } from "@/lib/logger";
logger.debug("Bridge configuration loaded", { bridgeId, config });
```

### API Debugging

#### Testing API Endpoints

```bash
# Test bridge start endpoint
curl -X POST http://localhost:3000/api/bridges/test-bridge/start \
  -H "Content-Type: application/json" \
  -d '{"bridgeConfig": {...}}'

# Test bridge stop endpoint
curl -X POST http://localhost:3000/api/bridges/test-bridge/stop
```

#### Network Debugging

```typescript
// Add request/response logging
if (process.env.NODE_ENV === "development") {
  console.log("API Request:", { method, url, body });
  console.log("API Response:", { status, data });
}
```

## Performance Optimization

### Development Performance

```bash
# Analyze bundle size
npm run build
npm run analyze

# Check for unused dependencies
npx depcheck

# Profile build times
npm run build -- --profile
```

### Runtime Performance

```typescript
// Use React DevTools Profiler
// Monitor component re-renders
// Check for memory leaks in bridge processes
```

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Find process using port 3000
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)
```

#### Node Modules Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### TypeScript Errors

```bash
# Clear TypeScript cache
rm -rf .next
npm run dev
```

#### Build Issues

```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

### Getting Help

1. **Check the logs**: Look at console output for error messages
2. **Check the documentation**: Refer to this guide and other docs
3. **Search existing issues**: Look for similar problems in GitHub issues
4. **Create a new issue**: Provide detailed steps to reproduce

## Development Best Practices

### Code Organization

- **Components**: Keep components focused and reusable
- **Hooks**: Extract complex logic into custom hooks
- **Types**: Define types in dedicated files
- **Utils**: Create utility functions for common operations

### Performance

- **Bundle Size**: Monitor and optimize bundle size
- **Code Splitting**: Use dynamic imports for large components
- **Memoization**: Use React.memo and useMemo appropriately
- **API Optimization**: Implement proper caching strategies

### Security

- **Input Validation**: Validate all user inputs with Zod
- **Environment Variables**: Never commit secrets to version control
- **Dependencies**: Regularly update dependencies for security patches
- **Error Handling**: Don't expose sensitive information in error messages

### Accessibility

- **Semantic HTML**: Use proper HTML elements
- **ARIA Labels**: Add accessibility labels where needed
- **Keyboard Navigation**: Ensure all functionality is keyboard accessible
- **Color Contrast**: Maintain sufficient color contrast ratios

This development setup guide provides everything needed to get started with Contextlayer development. Keep this document updated as the project evolves and new tools are added.
