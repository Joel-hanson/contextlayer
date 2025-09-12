# Pre-built API Connectors

This directory contains pre-built connector configurations for popular APIs. These connectors provide ready-to-use configurations that you can import directly into ContextLayer.

## Available Connectors

### Developer Tools

- **GitHub** (`github.json`) - GitHub REST API v3 for repositories, issues, and pull requests
- More coming soon: GitLab, Bitbucket, Azure DevOps

### Communication

- **Slack** (`slack.json`) - Slack Web API for messaging and workspace management
- Coming soon: Discord, Microsoft Teams, Telegram

### Data & Analytics

- **OpenWeatherMap** (`openweathermap.json`) - Weather data and forecasts
- Coming soon: Google Analytics, Mixpanel, Amplitude

### Content Management

- Coming soon: Notion, Airtable, Contentful, WordPress

### E-commerce

- Coming soon: Stripe, Shopify, WooCommerce

### Productivity

- Coming soon: Google Workspace, Office 365, Trello, Asana

## How to Use a Connector

### Method 1: Import via Dashboard

1. Go to your ContextLayer dashboard
2. Click "Create Bridge" → "Import from Template"
3. Select the connector you want to use
4. Configure authentication credentials
5. Save and start your bridge

### Method 2: Manual Import

1. Download the JSON file for your desired connector
2. In the dashboard, click "Create Bridge" → "Import Configuration"
3. Upload the JSON file
4. Configure authentication credentials
5. Save and start your bridge

## Connector Format

Each connector is a JSON file with the following structure:

```json
{
  "name": "API Name",
  "description": "Brief description of the API",
  "version": "1.0.0",
  "baseUrl": "https://api.example.com",
  "documentation": "https://docs.example.com",
  "authentication": {
    "type": "bearer|apikey|basic|oauth",
    "description": "Authentication description",
    "instructions": "How to get credentials"
  },
  "rateLimiting": {
    "requestsPerHour": 5000,
    "burstLimit": 100,
    "documentation": "Rate limiting docs URL"
  },
  "endpoints": [
    {
      "name": "Endpoint name",
      "method": "GET|POST|PUT|DELETE|PATCH",
      "path": "/api/path",
      "description": "What this endpoint does",
      "parameters": [],
      "requestBody": {}
    }
  ],
  "tags": ["category", "tags"],
  "category": "Category Name"
}
```

## Authentication Types

### Bearer Token

Used for APIs that require a bearer token in the Authorization header.

```json
{
  "type": "bearer",
  "description": "Personal Access Token",
  "instructions": "Get your token from..."
}
```

### API Key

Used for APIs that require an API key in headers or query parameters.

```json
{
  "type": "apikey",
  "keyLocation": "header|query",
  "keyName": "X-API-Key",
  "description": "API Key",
  "instructions": "Get your key from..."
}
```

### Basic Authentication

Used for APIs that require username/password authentication.

```json
{
  "type": "basic",
  "description": "Username and password",
  "instructions": "Use your account credentials"
}
```

### OAuth 2.0

Used for APIs that require OAuth 2.0 flow.

```json
{
  "type": "oauth",
  "description": "OAuth 2.0",
  "instructions": "Configure OAuth app..."
}
```

## Contributing New Connectors

We welcome contributions of new API connectors! Please follow these guidelines:

### Requirements

1. **Popular API**: The API should be widely used and have good documentation
2. **Stable API**: Use stable/production API versions, not beta endpoints
3. **Essential Endpoints**: Include the most commonly used endpoints (5-10 max)
4. **Proper Authentication**: Include clear instructions for getting credentials
5. **Rate Limiting**: Document any rate limits or usage restrictions

### Process

1. Create a new JSON file following the format above
2. Test the connector with real API credentials
3. Add clear documentation and examples
4. Submit a Pull Request with:
   - The connector JSON file
   - Testing documentation
   - Any special setup instructions

### Connector Checklist

- [ ] JSON file follows the standard format
- [ ] All endpoints tested and working
- [ ] Authentication instructions are clear
- [ ] Rate limiting information included
- [ ] Proper error handling considered
- [ ] Documentation links provided
- [ ] Examples included where helpful

## Popular APIs We Want

Help us expand our connector library! We're particularly interested in:

**High Priority:**

- Notion API
- Airtable API
- Google Drive API
- Stripe API
- Shopify API
- Discord API
- Twilio API

**Medium Priority:**

- HubSpot API
- Salesforce API
- Jira API
- Confluence API
- Figma API
- Linear API

**Community Requests:**

- See our [Issues](https://github.com/Joel-hanson/contextlayer/issues?q=is%3Aissue+is%3Aopen+label%3Aapi-connector) for requested connectors

## Testing Connectors

Before contributing, please test your connector:

1. **Import Test**: Import the JSON into ContextLayer
2. **Authentication Test**: Verify authentication works
3. **Endpoint Test**: Test each endpoint with various parameters
4. **Error Handling**: Test with invalid credentials/parameters
5. **Rate Limiting**: Verify rate limit handling

## Support

If you have questions about using or creating connectors:

- 📖 Check our [Documentation](../docs)
- 💬 Join our [Discussions](https://github.com/Joel-hanson/contextlayer/discussions)
- 🐛 Report issues with [Bug Reports](https://github.com/Joel-hanson/contextlayer/issues/new?template=bug_report.md)
- 💡 Request new connectors with [Feature Requests](https://github.com/Joel-hanson/contextlayer/issues/new?template=api_connector_request.md)

---

**Note**: Connector files are community-contributed and maintained. While we strive for accuracy, please verify API specifications with the official documentation before production use.
