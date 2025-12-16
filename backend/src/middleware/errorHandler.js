/**
 * Centralized error handling middleware
 * Catches all errors and formats them consistently
 */

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handler middleware
 * Catches all errors and formats response consistently
 */
export const errorHandler = (err, req, res, next) => {
  // Log error with context for debugging
  console.error("Error occurred:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    timestamp: new Date().toISOString(),
  });

  // Default error values
  let statusCode = err.statusCode || 500;
  let errorCode = err.errorCode || "SERVER_ERROR";
  let message = err.message || "Interní chyba serveru";

  // Handle specific error types
  if (err.name === "ValidationError") {
    statusCode = 400;
    errorCode = "VALIDATION_ERROR";
    message = "Chyba validace dat";
  } else if (
    err.name === "UnauthorizedError" ||
    err.name === "JsonWebTokenError"
  ) {
    statusCode = 401;
    errorCode = "UNAUTHORIZED";
    message = "Neplatné přihlašovací údaje";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    errorCode = "TOKEN_EXPIRED";
    message = "Platnost přihlášení vypršela";
  } else if (err.code === "23505") {
    // PostgreSQL unique violation
    statusCode = 409;
    errorCode = "DUPLICATE_ENTRY";
    message = "Záznam již existuje";
  } else if (err.code === "23503") {
    // PostgreSQL foreign key violation
    statusCode = 400;
    errorCode = "INVALID_REFERENCE";
    message = "Neplatný odkaz na související data";
  } else if (err.code === "22P02") {
    // PostgreSQL invalid text representation
    statusCode = 400;
    errorCode = "INVALID_DATA_FORMAT";
    message = "Neplatný formát dat";
  }

  // Don't expose internal error details in production
  if (process.env.NODE_ENV === "production" && !err.isOperational) {
    message = "Interní chyba serveru";
  }

  // Format error response consistently
  const errorResponse = {
    success: false,
    error: {
      code: errorCode,
      message: message,
    },
  };

  // Include error details in development
  if (process.env.NODE_ENV === "development") {
    errorResponse.error.details = {
      stack: err.stack,
      originalError: err.name,
    };
  }

  return res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 * Handles requests to non-existent routes
 */
export const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Cesta ${req.originalUrl} nebyla nalezena`,
    404,
    "NOT_FOUND"
  );
  next(error);
};

/**
 * Async handler wrapper
 * Wraps async route handlers to catch errors automatically
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
