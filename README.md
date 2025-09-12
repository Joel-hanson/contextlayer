# ContextLayer

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![GitHub stars](https://img.shields.io/github/stars/Joel-hanson/contextlayer.svg)](https://github.com/Joel-hanson/contextlayer/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/Joel-hanson/contextlayer.svg)](https://github.com/Joel-hanson/contextlayer/issues)
[![GitHub forks](https://img.shields.io/github/forks/Joel-hanson/contextlayer.svg)](https://github.com/Joel-hanson/contextlayer/network)
[![CI](https://github.com/Joel-hanson/contextlayer/workflows/CI/badge.svg)](https://github.com/Joel-hanson/contextlayer/actions)
[![Security Scan](https://github.com/Joel-hanson/contextlayer/workflows/Security%20Scan/badge.svg)](https://github.com/Joel-hanson/contextlayer/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

> 🚀 **Transform any REST API into a Model Context Protocol (MCP) server in minutes, not hours**

ContextLayer bridges the gap between traditional REST APIs and AI assistants, enabling seamless integration with Claude, VS Code Copilot, and other MCP-compatible tools without requiring any code modifications to your existing APIs.

## Features

- **REST API to MCP Bridge**: Convert existing REST APIs into MCP servers without code modifications
- **Visual Configuration Interface**: Web-based management dashboard for API configuration
- **Instant Deployment**: Start and stop MCP servers with one-click operations
- **Real-time Monitoring**: Track server status, uptime, and performance metrics
- **Multiple Authentication Methods**: Support for Bearer tokens, API keys, Basic authentication, and OAuth
- **OpenAPI Integration**: Import API configurations directly from OpenAPI/Swagger specifications
- **Modern Web Interface**: Built with Next.js, TypeScript, and shadcn/ui components
- **Persistent Data Storage**: PostgreSQL database for configuration management
- **Container Ready**: Full Docker support for streamlined deployment

## What is Model Context Protocol (MCP)?

The Model Context Protocol enables AI assistants to securely connect to external data sources and tools. ContextLayer serves as a bridge between traditional REST APIs and MCP, allowing any existing API to become accessible to AI assistants without requiring modifications to the original API implementation.

## Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Authentication](#authentication)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)

## Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/Joel-hanson/contextlayer.git
cd contextlayer

# Start with Docker Compose
docker-compose up -d

# Open http://localhost:3000
```

### Manual Installation

```bash
# Prerequisites: Node.js 18+, PostgreSQL

# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with your database URL and other settings

# 3. Set up database
npm run db:migrate
npm run db:seed

# 4. Start development server
npm run dev
```

## Installation

### Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **PostgreSQL** - [Installation guide](https://postgresql.org/download/)
- **npm or yarn** - Package manager
- **Git** - Version control

### Environment Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/Joel-hanson/contextlayer.git
   cd contextlayer
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Environment configuration**:

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your settings:

   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/contextlayer"

   # Authentication
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"

   # OAuth (optional)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

4. **Database setup**:

   ```bash
   # Run migrations
   npm run db:migrate

   # Seed with sample data
   npm run db:seed
   ```

5. **Start the application**:

   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000)

## Usage

### Create Your First Bridge

1. **Sign in** to the ContextLayer dashboard
2. **Navigate** to "Bridges" and click "Create Bridge"
3. **Configure** your API:
   - **Basic Info**: Name, description, and base URL
   - **Authentication**: Choose auth method and provide credentials
   - **Endpoints**: Define the API endpoints you want to expose

### Import from OpenAPI

```bash
# Upload your OpenAPI/Swagger spec file
# ContextLayer will automatically configure endpoints and authentication
```

### Start the MCP Server

1. **Toggle** the bridge to "Running" state
2. **Copy** the MCP server URL
3. **Configure** your AI assistant to use the MCP server

### Connect to AI Assistants

#### Claude Desktop

```json
// Add to your Claude config
{
  "mcpServers": {
    "my-api": {
      "command": "node",
      "args": ["/path/to/contextlayer/mcp-server.js"],
      "env": {
        "BRIDGE_URL": "http://localhost:3000/mcp/your-bridge-id"
      }
    }
  }
}
```

#### VS Code Copilot

```typescript
// Use the MCP extension for VS Code
// Configure with your bridge URL
```

## Configuration

### Bridge Configuration Structure

```typescript
interface BridgeConfig {
  name: string;
  description: string;
  baseUrl: string;
  authentication: {
    type: "none" | "bearer" | "apikey" | "basic" | "oauth";
    // ... auth-specific fields
  };
  endpoints: Array<{
    name: string;
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    path: string;
    description: string;
    parameters?: Array<Parameter>;
    requestBody?: RequestBodySchema;
  }>;
  rateLimiting?: {
    enabled: boolean;
    requestsPerMinute: number;
    burstLimit: number;
  };
}
```

### Supported Authentication Types

#### Bearer Token

```json
{
  "type": "bearer",
  "token": "your-bearer-token"
}
```

#### API Key

```json
{
  "type": "apikey",
  "key": "your-api-key",
  "keyLocation": "header", // or "query"
  "keyName": "X-API-Key"
}
```

#### Basic Authentication

```json
{
  "type": "basic",
  "username": "your-username",
  "password": "your-password"
}
```

#### OAuth 2.0

```json
{
  "type": "oauth",
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "authUrl": "https://api.example.com/oauth/authorize",
  "tokenUrl": "https://api.example.com/oauth/token"
}
```

## Authentication

ContextLayer supports multiple authentication methods for both the application and the APIs you're bridging.

### Application Authentication

- **Google OAuth** (recommended)
- **GitHub OAuth**
- **Email/Password** (can be disabled)

### API Authentication

- **No Authentication**
- **Bearer Token**
- **API Key** (header or query parameter)
- **Basic Authentication**
- **OAuth 2.0** (coming soon)

## API Reference

### Bridge Management

```typescript
// Create a bridge
POST /api/bridges
{
  "name": "My API Bridge",
  "baseUrl": "https://api.example.com",
  // ... configuration
}

// Start/Stop bridge
POST /api/bridges/{id}/start
POST /api/bridges/{id}/stop

// Get bridge status
GET /api/bridges/{id}/status
```

### MCP Endpoints

```typescript
// MCP server endpoint
GET /mcp/{bridgeId}

// Tool execution
POST /mcp/{bridgeId}/tools/execute
{
  "name": "get_user",
  "arguments": {
    "userId": "123"
  }
}
```

## Architecture

ContextLayer uses a modern, scalable architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Assistant  │───▶│  ContextLayer   │───▶│   REST API      │
│   (Claude, etc) │    │   MCP Server    │    │  (Any API)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Components

- **Next.js Frontend**: React-based UI for bridge management
- **MCP Server**: Protocol-compliant server for AI integration
- **Bridge Engine**: Handles API transformation and routing
- **Authentication Layer**: Manages auth for both app and APIs
- **PostgreSQL Database**: Stores configurations and metadata

## Deployment

### Docker Deployment

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

### Vercel Deployment

```bash
# Set up Vercel
npm run vercel:setup

# Deploy
vercel --prod
```

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Testing

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Run specific test file
npm test -- bridges.test.ts
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Contribution Steps

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Areas We Need Help

- **API Connectors**: Pre-built configurations for popular APIs
- **Testing**: More comprehensive test coverage
- **Documentation**: Examples and guides
- **UI/UX**: Design improvements and accessibility
- **Features**: New authentication methods, monitoring tools

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io) by Anthropic
- [shadcn/ui](https://ui.shadcn.com) for beautiful components
- [Next.js](https://nextjs.org) for the fantastic framework
- All our amazing [contributors](https://github.com/Joel-hanson/contextlayer/graphs/contributors)

## Links

- **Website**: [https://contextlayer.tech](https://contextlayer.tech)
- **Documentation**: [https://docs.contextlayer.tech](https://docs.contextlayer.tech)
- **Twitter**: [@contextlayer](https://twitter.com/contextlayer)

---

_Star this repository if you find it helpful!_
