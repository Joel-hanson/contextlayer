# MCP Server Standalone Tests

These tests are designed to validate the MCP server functionality by directly interacting with the database and using the MCP client. They run independently of the main test suite.

## Prerequisites

1. PostgreSQL database must be running and seeded with demo data
2. MCP server must be running (`npm run dev`)
3. Model Context Protocol client library must be installed

## Setup

1. Install dependencies:

```bash
npm install @modelcontextprotocol/sdk @anthropic-ai/sdk dotenv
npm install -D @types/node typescript
```

2. Ensure the database is seeded:

```bash
npm run db:seed
```

3. Start the development server:

```bash
npm run dev
```

## Running Tests

To run only the MCP server tests:

```bash
npm test __tests__/standalone/mcp-server.test.ts
```

## Test Coverage

The tests cover:

1. MCP Protocol Tests

   - Connection initialization
   - Tool listing
   - Tool execution
   - Rate limiting

2. Authentication Tests

   - Invalid authentication
   - Missing authentication
   - Token validation

3. Error Handling Tests

   - Non-existent tools
   - Malformed requests
   - Invalid parameters

4. Performance Tests
   - Response time validation
   - Concurrent request handling

## Configuration

The tests use environment variables:

- `NEXT_PUBLIC_APP_URL`: The URL of the MCP server (defaults to http://localhost:3000)

## Maintenance

To maintain these tests:

1. Keep the test bridge configuration up to date with your API schema
2. Update expected response formats when MCP protocol changes
3. Add new test cases when adding new MCP server features
4. Monitor and adjust performance test thresholds as needed
