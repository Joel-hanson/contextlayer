# Error Handling Implementation Guide

## Overview

This document describes the comprehensive error handling system implemented in the MCP Bridge application to ensure robust error management, proper logging, and user-friendly error responses.

## Error Handling Architecture

### 1. Backend Error Handling

#### Core Components

**Error Handler (`src/lib/error-handler.ts`)**

- `AppError` class for structured application errors
- `createApiError()` function to normalize different error types
- `withErrorHandler()` wrapper for API routes
- Proper error categorization and status codes

**Error Types**

```typescript
type ErrorCode =
  | "UNAUTHORIZED" // 401 - Authentication required
  | "FORBIDDEN" // 403 - Access denied
  | "NOT_FOUND" // 404 - Resource not found
  | "VALIDATION_ERROR" // 400 - Invalid input
  | "RATE_LIMIT_EXCEEDED" // 429 - Too many requests
  | "DATABASE_ERROR" // 500 - Database operation failed
  | "INTERNAL_ERROR" // 500 - Generic server error
  | "BAD_REQUEST" // 400 - Malformed request
  | "BRIDGE_NOT_FOUND" // 404 - Bridge specific not found
  | "BRIDGE_LIMIT_EXCEEDED" // 403 - Bridge creation limit
  | "INVALID_CONFIGURATION"; // 400 - Invalid bridge config
```

#### API Route Implementation

**Before (Manual Error Handling)**

```typescript
export async function GET(request: NextRequest) {
  try {
    // ... logic ...
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
```

**After (Structured Error Handling)**

```typescript
export const GET = withErrorHandler(async (request: NextRequest) => {
  // Rate limiting
  const rateLimitResult = apiRateLimit.check(request);
  if (!rateLimitResult.allowed) {
    throw new AppError("RATE_LIMIT_EXCEEDED", "Too many requests", 429);
  }

  // Authentication
  const session = await requireAuth(); // Throws AppError if unauthorized

  // Business logic
  const data = await fetchData();

  return NextResponse.json(data);
});
```

#### Security Improvements

**API Security (`src/lib/api-security.ts`)**

- `requireAuth()` throws structured errors instead of returning NextResponse
- `requireBridgeOwnership()` validates ownership with proper error handling
- Consistent error responses across all endpoints

### 2. Frontend Error Handling

#### Error Boundary Component

**React Error Boundary (`src/components/ErrorBoundary.tsx`)**

```typescript
<ErrorBoundary
  fallback={<CustomErrorDisplay />}
  onError={(error, errorInfo) => logError(error, errorInfo)}
>
  <YourComponent />
</ErrorBoundary>
```

Features:

- Catches JavaScript errors in React component tree
- Displays user-friendly error messages
- Shows detailed error information in development
- Provides retry and refresh options
- Logs errors for monitoring

#### API Error Hook

**Custom Hook (`src/hooks/useApiError.ts`)**

```typescript
const { handleApiCall, handleError, isLoading } = useApiError();

// Usage
const submitData = async (data) => {
  await handleApiCall(() => api.createBridge(data), {
    successMessage: "Bridge created successfully",
    onSuccess: (bridge) => router.push(`/bridges/${bridge.id}`),
    onError: (error) => setFormErrors(error.details),
  });
};
```

Features:

- Centralized API error handling
- Toast notifications for errors
- Loading state management
- Custom error callbacks
- Automatic error parsing

### 3. Error Response Format

#### Standardized API Response

**Success Response**

```json
{
  "data": { ... },
  "success": true
}
```

**Error Response**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "errors": [
        {
          "field": "name",
          "message": "Name is required",
          "code": "invalid_type"
        }
      ]
    }
  }
}
```

#### Error Details Structure

- **code**: Machine-readable error identifier
- **message**: Human-readable error message
- **details**: Additional context (validation errors, etc.)
- **statusCode**: HTTP status code

### 4. Logging and Monitoring

#### Error Logging

**Development Environment**

- Full error details including stack traces
- Component stack for React errors
- Detailed validation error information

**Production Environment**

- Sanitized error messages
- No sensitive information exposure
- Structured logging with timestamps

#### Log Format

```typescript
{
  code: 'VALIDATION_ERROR',
  message: 'Invalid input data',
  statusCode: 400,
  details: { ... },
  timestamp: '2024-08-10T15:30:00.000Z',
  stack: 'Error: ...' // development only
}
```

### 5. Specific Error Scenarios

#### Authentication Errors

```typescript
// Before
if (!session) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// After
const session = await requireAuth(); // Throws AppError('UNAUTHORIZED', ...)
```

#### Validation Errors

```typescript
// Zod validation automatically handled
const validatedData = schema.parse(body); // Throws ZodError
// Converted to: AppError('VALIDATION_ERROR', 'Invalid input data', 400, { errors: [...] })
```

#### Database Errors

```typescript
// Prisma errors automatically categorized:
// P2002 -> Unique constraint violation
// P2025 -> Record not found
// P2003 -> Foreign key constraint
```

#### Rate Limiting

```typescript
if (!rateLimitResult.allowed) {
  throw new AppError("RATE_LIMIT_EXCEEDED", "Too many requests", 429, {
    remaining: rateLimitResult.remaining,
    resetTime: rateLimitResult.resetTime,
  });
}
```

### 6. Implementation Checklist

#### Backend ✅

- [x] Global error handler with `withErrorHandler()`
- [x] Structured error classes and types
- [x] API security middleware with proper error handling
- [x] Database error categorization
- [x] Rate limiting error handling
- [x] Input validation error handling
- [x] Secure error logging (dev vs prod)

#### Frontend ✅

- [x] React Error Boundary component
- [x] API error handling hook
- [x] Toast notifications for errors
- [x] Loading states management
- [x] Error retry mechanisms
- [x] Development error details

#### API Routes ✅

- [x] All bridge routes use `withErrorHandler()`
- [x] Feedback routes use proper error handling
- [x] Authentication errors standardized
- [x] Rate limiting integrated
- [x] Validation errors properly formatted

### 7. Testing Error Handling

#### Manual Testing Scenarios

1. **Authentication**: Access protected route without login
2. **Validation**: Submit invalid form data
3. **Rate Limiting**: Make too many requests quickly
4. **Not Found**: Request non-existent bridge
5. **Network**: Simulate network failures
6. **JavaScript**: Trigger frontend errors

#### Error Response Examples

**Rate Limit Exceeded**

```bash
curl -X GET http://localhost:3000/api/bridges
# Response: 429 Too Many Requests
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests"
  }
}
```

**Validation Error**

```bash
curl -X POST http://localhost:3000/api/bridges -d '{}'
# Response: 400 Bad Request
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "errors": [
        {
          "field": "name",
          "message": "Name is required"
        }
      ]
    }
  }
}
```

### 8. Benefits

#### For Developers

- Consistent error handling across the application
- Easy debugging with structured error information
- Reduced boilerplate code in API routes
- Type-safe error handling

#### For Users

- Clear, actionable error messages
- Graceful error recovery with retry options
- No application crashes from unhandled errors
- Consistent user experience

#### For Operations

- Structured error logging for monitoring
- Error categorization for analytics
- Security through sanitized error messages
- Better incident response with detailed logs

### 9. Future Enhancements

#### Potential Improvements

1. **Error Tracking**: Integration with Sentry or similar
2. **Metrics**: Error rate monitoring and alerting
3. **User Feedback**: Error reporting mechanism
4. **Recovery**: Automatic retry mechanisms
5. **Caching**: Error response caching for rate limiting

## Summary

The comprehensive error handling system provides:

- **Robust Backend**: Structured error handling with proper categorization
- **User-Friendly Frontend**: Error boundaries and informative error messages
- **Security**: No sensitive information leakage in error responses
- **Monitoring**: Structured logging for debugging and analytics
- **Consistency**: Standardized error format across all endpoints

This implementation ensures the application handles errors gracefully while providing developers with the tools they need to debug issues and users with clear feedback about what went wrong.
