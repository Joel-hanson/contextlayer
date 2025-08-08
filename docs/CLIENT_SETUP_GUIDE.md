# MCP Bridge Client Configuration Guide

## Quick Setup Overview

Your MCP Bridge server converts REST APIs into Model Context Protocol (MCP) endpoints that AI assistants can use. Here's how to configure popular clients:

### 🔗 **Your MCP Endpoint Format**

```
http://localhost:3000/mcp/{BRIDGE_ID}
```

Copy your Bridge ID from the dashboard and replace `{BRIDGE_ID}` above.

---

## 🌐 **Client Configurations**

### 1. **Claude Desktop**

**Location**:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

**Configuration**:

```json
{
  "mcpServers": {
    "my-api-bridge": {
      "command": "node",
      "args": ["-e", "
        const fetch = require('node-fetch');
        const url = 'http://localhost:3000/mcp/YOUR_BRIDGE_ID';

        process.stdin.on('data', async (data) => {
          try {
            const request = JSON.parse(data.toString());
            const response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(request)
            });
            const result = await response.json();
            process.stdout.write(JSON.stringify(result) + '\\n');
          } catch (error) {
            process.stdout.write(JSON.stringify({
              jsonrpc: '2.0',
              error: { code: -32603, message: error.message },
              id: request?.id || null
            }) + '\\n');
          }
        });
      "]
    }
  }
}
```

### 2. **VS Code with GitHub Copilot**

**Location**: `~/.config/mcp/mcp.json`

**Configuration**:

```json
{
  "servers": {
    "my-api-bridge": {
      "transport": {
        "type": "http",
        "url": "http://localhost:3000/mcp/YOUR_BRIDGE_ID"
      }
    }
  }
}
```

### 3. **Warp Terminal (AI Features)**

**Steps**:

1. Open Warp Settings → AI → Model Context Protocol
2. Add HTTP-based MCP server:
   - **Server Name**: My API Bridge
   - **Protocol**: HTTP
   - **URL**: `http://localhost:3000/mcp/YOUR_BRIDGE_ID`
   - **Method**: POST

### 4. **Any HTTP-based MCP Client**

**Direct Configuration**:

```
Protocol: JSON-RPC 2.0 over HTTP
Method: POST
Content-Type: application/json
URL: http://localhost:3000/mcp/YOUR_BRIDGE_ID
```

**Supported Methods**:

- `initialize`: Get server capabilities
- `tools/list`: List available API endpoints
- `tools/call`: Execute API calls

---

## 🧪 **Testing Your Setup**

### Test 1: Initialize

```bash
curl -X POST http://localhost:3000/mcp/YOUR_BRIDGE_ID \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "initialize", "id": 1}'
```

**Expected Response**:

```json
{
  "jsonrpc": "2.0",
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": { "tools": {} },
    "serverInfo": { "name": "Your Bridge Name", "version": "1.0.0" }
  },
  "id": 1
}
```

### Test 2: List Tools

```bash
curl -X POST http://localhost:3000/mcp/YOUR_BRIDGE_ID \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "tools/list", "id": 2}'
```

### Test 3: Call a Tool

```bash
curl -X POST http://localhost:3000/mcp/YOUR_BRIDGE_ID \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "YOUR_TOOL_NAME", "arguments": {}}, "id": 3}'
```

---

## ✅ **Setup Checklist**

1. ✅ **Bridge Created**: Create and configure your API bridge in the dashboard
2. ✅ **Bridge ID Copied**: Copy the bridge ID from the MCP endpoint URL
3. ✅ **Server Running**: Ensure `npm run dev` is running (port 3000)
4. ✅ **Client Configured**: Add bridge to your MCP client configuration
5. ✅ **Connection Tested**: Run curl tests to verify connection
6. ✅ **Tools Available**: Confirm your API endpoints appear as MCP tools

---

## 🔧 **Troubleshooting**

### Common Issues:

**"Bridge not found"**

- ✅ Verify bridge ID is correct (copy from dashboard)
- ✅ Check bridge is enabled in dashboard

**"Connection refused"**

- ✅ Ensure MCP Bridge server is running (`npm run dev`)
- ✅ Check server is on port 3000 (`http://localhost:3000`)

**"No tools available"**

- ✅ Verify API endpoints are configured in bridge
- ✅ Test `tools/list` method with curl

**Claude Desktop not working**

- ✅ Check config file path is correct
- ✅ Restart Claude Desktop after config changes
- ✅ Verify JSON syntax in config file

---

## 🚀 **Next Steps**

Once configured, your API endpoints will appear as tools in your AI assistant. The assistant can:

- 📋 **List** all available API endpoints
- 🔧 **Call** endpoints with parameters
- 📊 **Receive** formatted API responses
- 🔄 **Chain** multiple API calls together

Your REST APIs are now accessible through the Model Context Protocol!

---

**Need help?** Check the dashboard docs or test your configuration with the curl commands above.
