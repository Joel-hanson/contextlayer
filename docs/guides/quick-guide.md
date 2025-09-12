# 🚀 Contextlayer Quick Start Guide

Transform any REST API into an AI-accessible tool using the Model Context Protocol (MCP) in just a few steps!

## 📋 What You'll Need

- A REST API you want to make accessible to AI assistants
- Optional: OpenAPI/Swagger specification file
- 5 minutes of your time

## 🏁 Quick Start (3 Steps)

### Step 1: Create Your Bridge

1. Go to **Dashboard → Bridges**
2. Click **"Create Bridge"**
3. Fill in basic information:
   - **Bridge Name**: `GitHub API Bridge`
   - **Description**: `Access GitHub repositories and issues`

### Step 2: Configure Your API

Switch to the **"API Config"** tab:

- **API Name**: `GitHub API`
- **Base URL**: `https://api.github.com`
- **Authentication**: Choose your API's auth method
  - Bearer Token, API Key, Basic Auth, or None

### Step 3: Add Endpoints

Switch to the **"Endpoints"** tab and add the API endpoints you want to expose:

**Example Endpoint:**

- **Name**: `Get Repository`
- **Method**: `GET`
- **Path**: `/repos/{owner}/{repo}`
- **Parameters**:
  - `owner` (string, required) - Repository owner
  - `repo` (string, required) - Repository name

Click **Save** and **Start** your bridge!

## 🎯 Using OpenAPI Import (Fastest Method)

If you have an OpenAPI/Swagger spec:

1. In the **API Config** tab, click **"Import OpenAPI"**
2. Choose your method:
   - **URL**: Paste your API's OpenAPI URL
   - **JSON**: Copy and paste the OpenAPI JSON
   - **File**: Upload your OpenAPI file
3. Click **"Import Configuration"**
4. All endpoints and parameters are automatically configured!

## 🔧 Advanced Configuration

### Authentication Types

**Bearer Token** (Most Common):

```
Type: Bearer
Token: ghp_xxxxxxxxxxxxxxxxxxxx
```

**API Key**:

```
Type: API Key
Header Name: X-API-Key
API Key: your-secret-key
```

**Basic Auth**:

```
Type: Basic
Username: your-username
Password: your-password
```

### Parameter Types

- **Path Parameters**: `{id}`, `{owner}`, `{repo}` in the URL path
- **Query Parameters**: URL query strings like `?page=1&per_page=10`
- **Request Body**: For POST/PUT/PATCH operations

### Adding Parameters

For each endpoint, click **"Add Parameter"**:

- **Name**: Parameter name (e.g., `id`, `title`, `page`)
- **Type**: string, number, boolean, object, array
- **Required**: Toggle on/off
- **Description**: Help AI understand what this parameter does

## 🤖 Using Your Bridge with AI

Once your bridge is running, AI assistants can use it through MCP:

**Your MCP Endpoint:**

```
http://localhost:3000/mcp/{your-bridge-id}
```

**Example AI Interaction:**

```
User: "Get information about the microsoft/vscode repository"

AI will automatically:
1. Find your GitHub bridge
2. Use the "Get Repository" tool
3. Pass owner="microsoft" and repo="vscode"
4. Return the repository information
```

## 🛠 Common Use Cases

### 1. Content Management System

```
Endpoint: GET /api/posts
Parameters:
- page (number, optional)
- category (string, optional)
```

### 2. Customer Database

```
Endpoint: POST /api/customers
Parameters:
- name (string, required)
- email (string, required)
- phone (string, optional)
```

### 3. Analytics API

```
Endpoint: GET /api/analytics/reports
Parameters:
- start_date (string, required)
- end_date (string, required)
- metrics (array, optional)
```

## ✅ Testing Your Bridge

1. **Test Individual Endpoints**: Click "Test Endpoint" button
2. **Check MCP Tools**: Visit your MCP endpoint to see available tools
3. **Monitor Logs**: View bridge activity in the Dashboard

**Test MCP Response:**

```bash
curl -X POST "http://localhost:3000/mcp/{bridge-id}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}'
```

## 🎨 Bridge Management

### Starting/Stopping Bridges

- **Green Toggle**: Bridge is running and accessible
- **Red Toggle**: Bridge is stopped
- **Status Indicators**:
  - 🟢 Active - Ready to handle requests
  - 🔴 Inactive - Stopped
  - 🟡 Error - Check configuration

### Editing Bridges

1. Click the **Edit** button on any bridge
2. Make your changes
3. **Save** to update configuration
4. **Restart** if the bridge was running

## 🚨 Troubleshooting

### Bridge Won't Start

- ✅ Check Base URL is accessible
- ✅ Verify authentication credentials
- ✅ Ensure at least one endpoint is configured

### AI Can't Use Tools

- ✅ Bridge status is "Active" (green)
- ✅ Parameters are properly configured
- ✅ Required parameters are marked correctly

### API Calls Failing

- ✅ Test endpoints individually
- ✅ Check authentication setup
- ✅ Verify parameter names match API expectations

## 🎯 Best Practices

### 📝 Naming Convention

- **Bridge Names**: Descriptive and specific (`Stripe Payment API`, not `API Bridge`)
- **Endpoint Names**: Action-focused (`Get Customer`, `Create Order`)
- **Parameters**: Match API documentation exactly

### 🔒 Security

- Use environment variables for sensitive tokens
- Limit endpoints to only what AI assistants need
- Regular review of bridge configurations

### 📊 Performance

- Group related endpoints in one bridge
- Use descriptive parameter descriptions
- Test endpoints before deploying

## 🌟 Pro Tips

1. **Import First**: Always try OpenAPI import before manual configuration
2. **Descriptive Names**: Good descriptions help AI choose the right tools
3. **Required Fields**: Mark parameters as required accurately
4. **Test Early**: Test each endpoint as you add it
5. **Monitor Usage**: Check bridge logs to understand AI usage patterns

## 🔗 Need Help?

- **Dashboard**: Monitor bridge status and logs
- **Documentation**: Check the API documentation tab
- **Community**: Join our community for support and examples

---

**Ready to connect your APIs to AI?** Start with the Dashboard and create your first bridge! 🎉

_This guide gets you started quickly. For advanced features and deployment, check the full documentation._
