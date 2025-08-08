# MCP Bridge Quick Reference

## 🚀 3-Step Setup

1. **Create Bridge** → Basic info (name, description)
2. **Configure API** → Base URL + Authentication
3. **Add Endpoints** → Define what AI can access

## 📥 Import Options

- **OpenAPI URL**: `https://api.example.com/openapi.json`
- **JSON Paste**: Copy OpenAPI spec directly
- **File Upload**: Upload `.json` or `.yaml` file

## 🔑 Authentication Quick Setup

```
Bearer:    Token: ghp_xxxxx
API Key:   Header: X-API-Key, Key: secret123
Basic:     Username + Password
None:      Public APIs
```

## 🎯 Endpoint Configuration

```
Name:         Get Repository
Method:       GET
Path:         /repos/{owner}/{repo}
Parameters:   owner (string, required)
              repo (string, required)
```

## 🤖 Your MCP Endpoint

```
http://localhost:3000/mcp/{bridge-id}
```

## ✅ Quick Test

```bash
curl -X POST "http://localhost:3000/mcp/{bridge-id}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

## 🔧 Common Issues

- Bridge won't start? Check Base URL & Auth
- AI can't use tools? Verify bridge is Active (green)
- API calls fail? Test endpoints individually

---

_💡 Pro Tip: Import OpenAPI first, then customize as needed!_
