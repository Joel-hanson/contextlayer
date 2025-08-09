# Getting Started with Contextlayer

> **Quick Start Guide**  
> **Estimated Time**: 15 minutes  
> **Difficulty**: Beginner

## What is Contextlayer?

Contextlayer transforms any REST API into a Model Context Protocol (MCP) server that AI assistants like Claude and VS Code Copilot can use. Instead of manually implementing MCP servers for each API, you can create bridges through our visual interface.

### Key Benefits

- ✅ **No Coding Required**: Visual configuration interface
- ✅ **Universal Compatibility**: Works with any REST API
- ✅ **AI Assistant Ready**: Instant integration with Claude, VS Code, and other MCP clients
- ✅ **Real-time Testing**: Validate your bridge before deployment

## Step 1: Access the Dashboard

1. **Visit the Application**: Go to `http://localhost:3000` (or your deployed URL)
2. **Navigate to Dashboard**: Click "Get Started" or "Dashboard" in the navigation
3. **Explore the Interface**: Familiarize yourself with the sidebar navigation

## Step 2: Create Your First Bridge

### Option A: Using a Template (Recommended)

1. **Click "Create Bridge"** on the dashboard
2. **Choose a Template**: Select from pre-configured popular APIs
   - GitHub API
   - Slack API
   - Custom REST API
3. **Customize Parameters**: Fill in your API credentials and specific settings
4. **Test Connection**: Verify your API credentials work
5. **Deploy Bridge**: Start your MCP server

### Option B: Manual Configuration

1. **Click "Create Bridge"** on the dashboard
2. **Basic Information Tab**:

   ```
   Bridge Name: My API Bridge
   Description: Bridge for my custom API
   Port: 3001
   ```

3. **API Configuration Tab**:

   ```
   API Name: My REST API
   Base URL: https://api.example.com
   Description: My company's internal API
   ```

4. **Authentication Tab**:
   Choose your authentication method:

   - **None**: For public APIs
   - **Bearer Token**: For APIs using Authorization header
   - **API Key**: For APIs using custom headers or query parameters
   - **Basic Auth**: For username/password authentication

5. **Endpoints Tab**:
   Add the API endpoints you want to expose:
   ```
   Endpoint Name: Get Users
   Method: GET
   Path: /users
   Description: Retrieve list of users
   ```

## Step 3: Configure Authentication

### Bearer Token Example

```
Authentication Type: Bearer Token
Token: your-api-token-here
```

### API Key Example

```
Authentication Type: API Key
API Key: your-api-key-here
Header Name: X-API-Key
```

### Basic Auth Example

```
Authentication Type: Basic Auth
Username: your-username
Password: your-password
```

## Step 4: Add API Endpoints

For each endpoint you want to expose to AI assistants:

1. **Click "Add Endpoint"**
2. **Fill in Details**:

   - **Name**: Descriptive name for the endpoint
   - **Method**: HTTP method (GET, POST, PUT, DELETE, PATCH)
   - **Path**: API endpoint path (e.g., `/users/{id}`)
   - **Description**: What this endpoint does

3. **Add Parameters** (if needed):
   - **Path Parameters**: e.g., `id` in `/users/{id}`
   - **Query Parameters**: e.g., `limit`, `offset` for pagination
   - **Request Body**: For POST/PUT requests

## Step 5: Test Your Configuration

Before starting the bridge, test your configuration:

1. **API Connectivity**: Verify the base URL is accessible
2. **Authentication**: Test your credentials work
3. **Endpoints**: Validate each endpoint responds correctly
4. **MCP Tools**: Preview the generated MCP tools

## Step 6: Start Your Bridge

1. **Click "Save" to create the bridge**
2. **Click the "Play" button** to start the bridge server
3. **Verify Status**: Ensure the bridge shows as "Running"
4. **Note the Port**: Remember the port number for MCP client configuration

## Step 7: Connect with AI Assistants

### Connecting with Claude Desktop

1. **Open Claude Desktop Application**
2. **Go to Settings > Developer**
3. **Add MCP Server**:
   ```json
   {
     "my-api-bridge": {
       "command": "npx",
       "args": ["@modelcontextprotocol/server-stdio", "http://localhost:3001"]
     }
   }
   ```
4. **Restart Claude Desktop**

### Connecting with VS Code

1. **Install the MCP Extension** (when available)
2. **Configure MCP Server**:
   ```json
   {
     "mcp.servers": {
       "my-api-bridge": {
         "url": "http://localhost:3001"
       }
     }
   }
   ```

## Step 8: Test the Integration

Once connected, test your bridge:

1. **Ask Claude**: "Can you help me use the My API Bridge?"
2. **Request Data**: "Get a list of users from my API"
3. **Create Data**: "Add a new user with name 'John Doe'"

## Common Use Cases

### Internal Company APIs

```
Use Case: Make company HR API available to AI assistant
Example: "Show me employee directory" or "Request time off"
Bridge: HR API → MCP → Claude
```

### Third-Party Service Integration

```
Use Case: Integrate project management tools
Example: "Create a new task" or "Show project status"
Bridge: Jira/Asana API → MCP → AI Assistant
```

### Data Analysis APIs

```
Use Case: Query analytics and reporting APIs
Example: "Show sales data for last month"
Bridge: Analytics API → MCP → AI Assistant
```

## Troubleshooting

### Bridge Won't Start

- **Check Port**: Ensure the port isn't already in use
- **Verify API URL**: Test the base URL in a browser
- **Check Credentials**: Validate authentication works manually

### API Connection Fails

- **Network Access**: Ensure the API is accessible from your machine
- **CORS Issues**: Some APIs may require CORS configuration
- **Rate Limiting**: Check if you're hitting API rate limits

### AI Assistant Can't See Tools

- **MCP Configuration**: Verify MCP client configuration is correct
- **Bridge Status**: Ensure bridge is running and accessible
- **Restart Required**: Some MCP clients require restart after configuration

## Next Steps

### Explore Advanced Features

- **Multiple Endpoints**: Add more API endpoints to your bridge
- **Parameter Mapping**: Configure complex parameter transformations
- **Response Formatting**: Customize how API responses are presented
- **Error Handling**: Configure custom error messages

### Monitor Performance

- **Dashboard Analytics**: View request metrics and performance data
- **Logs**: Check bridge logs for troubleshooting
- **Usage Patterns**: Understand how AI assistants use your APIs

### Share and Collaborate

- **Export Configuration**: Share bridge configurations with team members
- **Template Creation**: Create templates for commonly used APIs
- **Documentation**: Add detailed descriptions for your APIs

## FAQ

### Q: Can I use multiple bridges at the same time?

**A**: Yes! You can create and run multiple bridges simultaneously, each on different ports.

### Q: What happens if my API changes?

**A**: You can edit your bridge configuration at any time and restart the bridge to pick up changes.

### Q: Can I use bridges in production?

**A**: The current version is designed for development and testing. Production features are planned for future releases.

### Q: Do I need to restart my AI assistant when I update a bridge?

**A**: It depends on the MCP client. Some require restart, others can detect changes automatically.

### Q: Can I see what requests the AI assistant is making?

**A**: Yes! Check the bridge logs and analytics dashboard to see all API requests and responses.

## Need Help?

- 📖 **Documentation**: Check the complete documentation in the `docs/` folder
- 🐛 **Issues**: Report bugs or request features on GitHub
- 💬 **Discussions**: Join community discussions for tips and best practices
- 📧 **Support**: Contact the development team for technical support

---

**Congratulations!** 🎉 You've successfully created your first Contextlayer. Your REST API is now accessible to AI assistants through the Model Context Protocol.
