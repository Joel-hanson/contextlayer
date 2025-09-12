# Contributing to ContextLayer

We welcome contributions to ContextLayer! This document provides guidelines for contributing to the project.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL (for database)
- Git

### Development Setup

1. Fork the repository on GitHub
2. Clone your fork locally:

   ```bash
   git clone https://github.com/YOUR_USERNAME/contextlayer.git
   cd contextlayer
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

5. Set up the database:

   ```bash
   # Start PostgreSQL (via Docker)
   docker-compose up -d postgres

   # Run migrations
   npm run db:migrate

   # Seed the database
   npm run db:seed
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/Joel-hanson/contextlayer/issues)
2. If not, create a new issue with:
   - Clear description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, Node.js version, etc.)

### Suggesting Features

1. Check [existing feature requests](https://github.com/Joel-hanson/contextlayer/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement)
2. Create a new issue with:
   - Clear description of the feature
   - Use case and motivation
   - Possible implementation approach

### Contributing Code

#### Types of Contributions We Welcome

- **API Connectors**: Pre-built configurations for popular APIs
- **Authentication Methods**: New authentication types
- **UI Improvements**: Better user experience and accessibility
- **Documentation**: Examples, guides, API docs
- **Bug Fixes**: Resolution of reported issues
- **Performance Improvements**: Optimization and efficiency gains

#### Pull Request Process

1. Create a feature branch from `main`:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following our coding standards
3. Add or update tests for your changes
4. Update documentation if needed
5. Run the test suite:

   ```bash
   npm run test
   npm run lint
   ```

6. Commit your changes with a clear message:

   ```bash
   git commit -m "feat: add support for OAuth 2.0 authentication"
   ```

7. Push to your fork and create a Pull Request

#### Commit Message Convention

We follow [Conventional Commits](https://conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Build process or auxiliary tool changes

### Code Style Guidelines

- **TypeScript**: Use strict TypeScript with proper typing
- **Formatting**: We use Prettier (run `npm run lint` to format)
- **Components**: Follow the existing pattern in `src/components/`
- **API Routes**: Use proper error handling and validation
- **Database**: Use Prisma migrations for schema changes

### Testing

- Write unit tests for new functions and components
- Add integration tests for API endpoints
- Test your changes across different browsers
- Ensure all existing tests pass

### Documentation

- Update README.md for new features
- Add JSDoc comments for functions and components
- Update API documentation if adding new endpoints
- Add examples for new authentication types

## API Connector Contributions

We especially welcome contributions of pre-built API connectors for popular services:

### Connector Structure

```typescript
// connectors/github.json
{
  "name": "GitHub API",
  "description": "GitHub REST API v4",
  "baseUrl": "https://api.github.com",
  "authentication": {
    "type": "bearer",
    "tokenHeader": "Authorization",
    "tokenPrefix": "Bearer "
  },
  "endpoints": [
    {
      "name": "Get User",
      "method": "GET",
      "path": "/user",
      "description": "Get the authenticated user"
    }
  ]
}
```

### Priority APIs

We're particularly interested in connectors for:

- GitHub API
- Slack API
- Discord API
- Notion API
- Airtable API
- Google APIs (Gmail, Drive, Calendar)
- Microsoft API
- Stripe API
- Shopify API
- Twilio API

## Community Guidelines

- Be respectful and inclusive
- Help others learn and grow
- Focus on constructive feedback
- Follow our [Code of Conduct](CODE_OF_CONDUCT.md)

## Getting Help

- Check the [documentation](https://github.com/Joel-hanson/contextlayer/tree/main/docs)
- Ask questions in [Discussions](https://github.com/Joel-hanson/contextlayer/discussions)

## Recognition

Contributors will be:

- Listed in our README contributors section
- Mentioned in release notes for significant contributions
- Invited to join our contributor Discord channel
- Eligible for contributor swag (coming soon)

Thank you for contributing to ContextLayer!
