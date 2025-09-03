# ContextLayer

Transform any REST API into a Model Context Protocol (MCP) server, making your APIs accessible to AI tools like Claude, VS Code Copilot, and more.

## Features

- **Bridge REST APIs to MCP**: Convert any REST API into an MCP server
- **Visual Configuration**: Easy-to-use web interface for API configuration
- **One-Click Deployment**: Start and stop MCP servers with a single click
- **Real-time Monitoring**: Monitor server status and uptime
- **Modern UI**: Clean, responsive interface built with shadcn/ui
- **Persistent Storage**: Configurations saved locally in browser storage

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn package manager

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd contextlayer
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

### 1. Configure Your API

- Add your REST API base URL
- Define authentication (Bearer token, API key, Basic auth)
- Configure endpoints with parameters and schemas

### 2. Generate MCP Tools

- Automatically converts API endpoints to MCP tool definitions
- Maps HTTP methods and parameters to MCP input schemas
- Handles request/response transformation

### 3. Start the Bridge

- Creates an MCP server that proxies requests to your REST API
- Provides MCP-compliant interface for AI tools
- Manages authentication and error handling

### 4. Connect AI Tools

- Use the generated MCP server with Claude Desktop
- Integrate with VS Code extensions
- Connect to any MCP-compatible client

## Technology Stack

- **Framework**: Next.js 15 with TypeScript
- **UI Components**: shadcn/ui with Tailwind CSS
- **MCP SDK**: @modelcontextprotocol/sdk
- **API Client**: Axios
- **Validation**: Zod schemas

## Admin Dashboard

The application includes a comprehensive admin dashboard for monitoring and management:

### Features

- User analytics and growth metrics
- Bridge usage statistics
- API endpoint monitoring
- System health indicators
- User feedback and ratings

### Setup Admin Users

1. Set the `ADMIN_EMAILS` environment variable in your `.env.local`:

```bash
ADMIN_EMAILS="admin@example.com,admin2@example.com"
```

2. Run the admin seed script:

```bash
npm run db:seed-admin
```

3. Admin users will be created with the email addresses specified and default password `admin123`

4. Access the admin dashboard at `/admin` (requires admin role)

### Default Admin Account

If no `ADMIN_EMAILS` is set, a default admin account will be created:

- Email: `admin@contextlayer.tech`
- Password: `admin123`

**Important**: Change these default credentials in production!

## Model Context Protocol (MCP)

This project implements the Model Context Protocol specification. For more information:

- [MCP Documentation](https://modelcontextprotocol.io)
- [MCP GitHub Repository](https://github.com/modelcontextprotocol)
