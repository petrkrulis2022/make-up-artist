import { jest } from "@jest/globals";
import {
  AppError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
} from "./errorHandler.js";

describe("Error Handler Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      path: "/api/test",
      method: "GET",
      body: {},
      params: {},
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();

    // Suppress console.error during tests
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("AppError class", () => {
    it("should create an operational error with correct properties", () => {
      const error = new AppError("Test error", 400, "TEST_ERROR");

      expect(error.message).toBe("Test error");
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe("TEST_ERROR");
      expect(error.isOperational).toBe(true);
    });
  });

  describe("errorHandler", () => {
    it("should return error response with correct format", () => {
      const error = new AppError("Test error", 400, "TEST_ERROR");

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "TEST_ERROR",
          message: "Test error",
        },
      });
    });

    it("should return 500 status code for unhandled errors", () => {
      const error = new Error("Unhandled error");

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Unhandled error",
        },
      });
    });

    it("should handle ValidationError with 400 status", () => {
      const error = new Error("Validation failed");
      error.name = "ValidationError";

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Chyba validace dat",
        },
      });
    });

    it("should handle JsonWebTokenError with 401 status", () => {
      const error = new Error("Invalid token");
      error.name = "JsonWebTokenError";

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Neplatné přihlašovací údaje",
        },
      });
    });

    it("should handle TokenExpiredError with 401 status", () => {
      const error = new Error("Token expired");
      error.name = "TokenExpiredError";

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "TOKEN_EXPIRED",
          message: "Platnost přihlášení vypršela",
        },
      });
    });

    it("should handle PostgreSQL unique violation (23505)", () => {
      const error = new Error("Duplicate entry");
      error.code = "23505";

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "DUPLICATE_ENTRY",
          message: "Záznam již existuje",
        },
      });
    });

    it("should handle PostgreSQL foreign key violation (23503)", () => {
      const error = new Error("Foreign key violation");
      error.code = "23503";

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INVALID_REFERENCE",
          message: "Neplatný odkaz na související data",
        },
      });
    });

    it("should handle PostgreSQL invalid text representation (22P02)", () => {
      const error = new Error("Invalid data format");
      error.code = "22P02";

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INVALID_DATA_FORMAT",
          message: "Neplatný formát dat",
        },
      });
    });

    it("should log error with context", () => {
      const error = new AppError("Test error", 400, "TEST_ERROR");
      const consoleSpy = jest.spyOn(console, "error");

      errorHandler(error, req, res, next);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error occurred:",
        expect.objectContaining({
          message: "Test error",
          path: "/api/test",
          method: "GET",
        })
      );
    });

    it("should include error details in development mode", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const error = new AppError("Test error", 400, "TEST_ERROR");

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            details: expect.any(Object),
          }),
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it("should hide internal error details in production for non-operational errors", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const error = new Error("Internal error");

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Interní chyba serveru",
        },
      });

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("notFoundHandler", () => {
    it("should create 404 error with Czech message", () => {
      req.originalUrl = "/api/nonexistent";

      notFoundHandler(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Cesta /api/nonexistent nebyla nalezena",
          statusCode: 404,
          errorCode: "NOT_FOUND",
        })
      );
    });
  });

  describe("asyncHandler", () => {
    it("should catch async errors and pass to next", async () => {
      const error = new Error("Async error");
      const asyncFn = jest.fn().mockRejectedValue(error);
      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it("should handle successful async operations", async () => {
      const asyncFn = jest.fn().mockResolvedValue("success");
      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(req, res, next);

      expect(asyncFn).toHaveBeenCalledWith(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
