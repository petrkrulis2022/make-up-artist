# Error Handling and Security Implementation Summary

## Task 7: Set up backend error handling and security

### Completed Subtasks

#### 7.1 Create centralized error handling middleware ✅

**Files Created:**

- `backend/src/middleware/errorHandler.js`

**Features Implemented:**

- `AppError` class for operational errors with status codes and error codes
- `errorHandler` middleware that:
  - Catches all errors and formats them consistently
  - Returns responses with `success: false`, error code, and message
  - Logs errors with full context (path, method, body, params, query, timestamp)
  - Returns appropriate HTTP status codes (400, 401, 404, 409, 500, etc.)
  - Handles specific error types:
    - ValidationError → 400
    - JsonWebTokenError → 401
    - TokenExpiredError → 401
    - PostgreSQL errors (23505, 23503, 22P02)
  - Includes error details in development mode
  - Hides internal error details in production
- `notFoundHandler` middleware for 404 errors with Czech messages
- `asyncHandler` wrapper for automatic error catching in async routes

**Integration:**

- Added to `server.js` as the last middleware (after all routes)
- 404 handler added before error handler

#### 7.2 Add security middleware ✅

**Files Created:**

- `backend/src/middleware/securityMiddleware.js`

**Files Modified:**

- `backend/package.json` - Added `express-rate-limit` dependency
- `backend/src/server.js` - Integrated security middleware
- `backend/src/routes/auth.js` - Added login rate limiter

**Features Implemented:**

- **Helmet.js**: Already configured for security headers
- **CORS**: Configured to allow frontend origin from environment variable
- **Request size limits**: 10MB limit for JSON and URL-encoded bodies
- **Rate limiting**:
  - `loginRateLimiter`: 5 attempts per 15 minutes for login endpoint
  - `apiRateLimiter`: 100 requests per 15 minutes for all API routes
  - Both return Czech error messages when limits are exceeded
- All rate limiters use standard headers and Czech error messages

#### 7.3 Write unit tests for error handling ✅

**Files Created:**

- `backend/src/middleware/errorHandler.test.js` - Unit tests for error handler
- `backend/src/middleware/securityMiddleware.test.js` - Unit tests for security middleware
- `backend/tests/errorHandling.integration.test.js` - Integration tests

**Test Coverage:**

**Error Handler Tests:**

- AppError class creation
- Error response format (success: false, error code, message)
- HTTP status codes (400, 401, 404, 409, 500)
- Specific error type handling (ValidationError, JsonWebTokenError, TokenExpiredError)
- PostgreSQL error handling (23505, 23503, 22P02)
- Error logging with context
- Development vs production error details
- 404 handler with Czech messages
- Async handler error catching

**Security Middleware Tests:**

- Request size limits configuration
- Rate limiter configuration
- Czech error messages in rate limiters

**Integration Tests:**

- Error response format consistency
- HTTP status codes for different error types
- Czech error messages for all error types
- 404 handling
- Successful request handling (no interference)

**Files Modified:**

- `backend/jest.config.js` - Updated to include src tests

## Requirements Validated

✅ **Requirement 6.5**: Contact form validation errors in Czech
✅ **Requirement 7.2**: Authentication errors in Czech, rate limiting for login
✅ **Requirement 8.4**: Admin upload error messages in Czech
✅ **Requirement 9.4**: Admin deletion error messages in Czech
✅ **All error handling requirements**: Consistent error format, appropriate status codes, Czech messages

## Security Features

1. **Helmet.js**: Security headers protection
2. **CORS**: Restricted to frontend origin only
3. **Rate Limiting**:
   - Login endpoint: 5 attempts per 15 minutes
   - General API: 100 requests per 15 minutes
4. **Request Size Limits**: 10MB maximum
5. **Error Handling**: No internal details exposed in production

## Error Response Format

All errors follow this consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Chybová zpráva v češtině"
  }
}
```

In development mode, additional details are included:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Chybová zpráva v češtině",
    "details": {
      "stack": "...",
      "originalError": "..."
    }
  }
}
```

## Testing

Run tests with:

```bash
npm test
```

Run specific test files:

```bash
npm test -- errorHandler.test.js
npm test -- securityMiddleware.test.js
npm test -- errorHandling.integration.test.js
```

## Next Steps

The backend now has comprehensive error handling and security middleware in place. All errors are:

- Formatted consistently
- Returned with appropriate HTTP status codes
- Displayed in Czech language
- Logged with full context for debugging
- Protected from exposing internal details in production

The API is protected with:

- Security headers (Helmet)
- CORS restrictions
- Rate limiting
- Request size limits
