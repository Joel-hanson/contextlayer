# Enhanced Request Body Handling for Contextlayer

## Problem Statement

The original Contextlayer implementation had limited support for POST, PUT, and PATCH operations. When users tried to use these MCP actions, the AI assistants couldn't understand:

1. **What parameters to send** - No schema information for request bodies
2. **How to structure the data** - No type information or validation
3. **What fields are required** - No indication of mandatory vs optional fields
4. **Parameter validation** - No constraints or format specifications

## Enhanced Solution

### 1. Comprehensive Request Body Schema Support

The enhanced Contextlayer now provides detailed schema information for all request bodies:

```typescript
interface RequestBodySchema {
  contentType?: string; // e.g., 'application/json'
  schema?: unknown; // Full OpenAPI schema
  required?: boolean; // Whether request body is required
  properties?: Record<
    string,
    {
      // Individual field definitions
      type: string; // 'string', 'number', 'boolean', etc.
      description?: string; // Field description
      required?: boolean; // Whether field is required
      enum?: string[]; // Allowed values
      format?: string; // e.g., 'email', 'date-time'
      minimum?: number; // Min value for numbers
      maximum?: number; // Max value for numbers
      pattern?: string; // Regex pattern for strings
      items?: unknown; // Schema for array items
      properties?: Record<string, unknown>; // Nested object properties
    }
  >;
}
```

### 2. Smart Parameter Handling

#### For Path Parameters:

- Automatically replaced in URL: `/posts/{id}` → `/posts/123`
- Required parameters clearly marked in schema

#### For Query Parameters:

- Appended to URL as query string: `?page=1&limit=10`
- Optional parameters with default values supported

#### For Request Body:

- **Individual Fields**: Each property exposed as separate MCP tool parameter
- **Type Validation**: Full type information provided to AI assistants
- **Required Fields**: Clearly marked to prevent incomplete requests

### 3. Enhanced Tool Descriptions

The MCP tools now provide comprehensive descriptions:

```
POST /posts - Create a new post

Required parameters: title (string), body (string), userId (number)
Optional parameters: published (boolean)

Required body fields: title (string), body (string), userId (number)
Optional body fields: published (boolean), tags (array)
```

### 4. Intelligent Request Body Building

```typescript
// Example: Creating a post
{
    "title": "My New Post",
    "body": "This is the content of my post",
    "userId": 123,
    "published": true,
    "tags": ["tech", "programming"]
}
```

The bridge automatically:

- Collects individual field arguments
- Validates required fields are present
- Builds proper JSON request body
- Sends with correct content-type headers

## OpenAPI Integration Benefits

When importing from OpenAPI specifications, the bridge now:

1. **Extracts Full Schema Information**:

   - Request body schemas from `requestBody.content.application/json.schema`
   - Parameter definitions with types, constraints, and descriptions
   - Required vs optional field information

2. **Generates Rich MCP Tool Schemas**:
   ```json
   {
     "name": "createPost",
     "description": "Create a new post\n\nRequired body fields: title (string), body (string), userId (number)",
     "inputSchema": {
       "type": "object",
       "properties": {
         "title": {
           "type": "string",
           "description": "Post title"
         },
         "body": {
           "type": "string",
           "description": "Post content"
         },
         "userId": {
           "type": "number",
           "description": "Author user ID"
         },
         "published": {
           "type": "boolean",
           "description": "Publication status",
           "default": false
         }
       },
       "required": ["title", "body", "userId"]
     }
   }
   ```

## Real-World Example

### Before (Limited Support):

```
AI: I want to create a post
MCP: Tool "createPost" available, but no schema information
AI: What parameters does it need?
MCP: Unknown - just a generic "requestBody" object
```

### After (Enhanced Support):

```
AI: I want to create a post
MCP: Tool "createPost" available with full schema:
     - title (string, required): Post title
     - body (string, required): Post content
     - userId (number, required): Author user ID
     - published (boolean, optional): Publication status
AI: Creating post with proper parameters
MCP: ✅ Request body built correctly and sent to API
```

## Benefits for AI Assistants

1. **Complete Understanding**: AI knows exactly what data to send
2. **Proper Validation**: Required fields are clearly identified
3. **Type Safety**: Correct data types prevent API errors
4. **Rich Context**: Descriptions help AI understand field purposes
5. **Default Values**: Pre-filled optional parameters when available

## Benefits for Developers

1. **Automatic Schema Generation**: No manual MCP tool configuration
2. **OpenAPI Compatibility**: Direct import from existing API specs
3. **Full Feature Support**: All HTTP methods properly supported
4. **Error Prevention**: Schema validation catches issues early
5. **Documentation**: Self-documenting tools with rich descriptions

This enhancement transforms the Contextlayer from a basic API proxy into a sophisticated, schema-aware integration that enables AI assistants to interact with any REST API effectively and safely.
