# API Documentation

Technical reference documentation for ContextLayer's API endpoints and integration patterns.

## Available Documentation

### Core Reference

- **[API Reference](./api-reference.md)** - Complete REST API documentation
- **[Quick Reference](./quick-reference.md)** - Essential commands and examples

## API Overview

ContextLayer provides a comprehensive REST API for:

### Bridge Management

- Create, update, and delete API bridges
- Start and stop bridge servers
- Monitor bridge status and health

### MCP Integration

- Generate MCP tools from API endpoints
- Execute API calls through MCP protocol
- Handle authentication and rate limiting

### Configuration

- Import/export bridge configurations
- Manage API credentials securely
- Set up rate limiting and caching

## Authentication

All API endpoints require authentication. See our [Authentication Guide](../guides/authentication-setup.md) for setup instructions.

## Rate Limiting

API endpoints are rate limited to ensure fair usage. See [Rate Limiting](../development/rate-limiting.md) for details.

## Examples

### Quick Start Example

```bash
# Get bridge status
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-domain.com/api/bridges/your-bridge-id/status

# Start a bridge
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  https://your-domain.com/api/bridges/your-bridge-id/start
```

## SDKs and Libraries

Currently, ContextLayer provides:

- REST API (documented here)
- MCP protocol implementation
- Pre-built connectors for popular APIs

## Need Help?

- **Questions**: [GitHub Discussions](https://github.com/Joel-hanson/contextlayer/discussions)
- **Bugs**: [GitHub Issues](https://github.com/Joel-hanson/contextlayer/issues)
- **Development**: See [Development docs](../development/)
