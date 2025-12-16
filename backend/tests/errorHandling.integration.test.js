import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";
import {
  errorHandler,
  notFoundHandler,
  AppError,
} from "../src/middleware/errorHandler.js";

// Create a test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Test routes
  app.get("/api/test/success", (req, res) => {
    res.json({ success: true, message: "Success" });
  });

  app.get("/api/test/app-error", (req, res, next) => {
    next(new AppError("Testovací chyba", 400, "TEST_ERROR"));
  });

  app.get("/api/test/server-error", (req, res, next) => {
    next(new Error("Interní chyba"));
  });

  app.get("/api/test/validation-error", (req, res, next) => {
    const error = new Error("Validation failed");
    error.name = "ValidationError";
    next(error);
  });

  app.get("/api/test/auth-error", (req, res, next) => {
    const error = new Error("Invalid token");
    error.name = "JsonWebTokenError";
    next(error);
  });

  // 404 handler
  app.use(notFoundHandler);

  // Error handler
  app.use(errorHandler);

  return app;
};

describe("Error Handling Integration Tests", () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    // Suppress console.error during tests
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Error Response Format", () => {
    it("should return error with success: false", async () => {
      const response = await request(app).get("/api/test/app-error");

      expect(response.body).toHaveProperty("success", false);
    });

    it("should return error with error code", async () => {
      const response = await request(app).get("/api/test/app-error");

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "TEST_ERROR");
    });

    it("should return error with message", async () => {
      const response = await request(app).get("/api/test/app-error");

      expect(response.body.error).toHaveProperty("message", "Testovací chyba");
    });
  });

  describe("HTTP Status Codes", () => {
    it("should return 400 for AppError with 400 status", async () => {
      const response = await request(app).get("/api/test/app-error");

      expect(response.status).toBe(400);
    });

    it("should return 500 for unhandled errors", async () => {
      const response = await request(app).get("/api/test/server-error");

      expect(response.status).toBe(500);
    });

    it("should return 400 for validation errors", async () => {
      const response = await request(app).get("/api/test/validation-error");

      expect(response.status).toBe(400);
    });

    it("should return 401 for authentication errors", async () => {
      const response = await request(app).get("/api/test/auth-error");

      expect(response.status).toBe(401);
    });

    it("should return 404 for non-existent routes", async () => {
      const response = await request(app).get("/api/nonexistent");

      expect(response.status).toBe(404);
    });
  });

  describe("Czech Error Messages", () => {
    it("should return Czech message for validation errors", async () => {
      const response = await request(app).get("/api/test/validation-error");

      expect(response.body.error.message).toBe("Chyba validace dat");
    });

    it("should return Czech message for authentication errors", async () => {
      const response = await request(app).get("/api/test/auth-error");

      expect(response.body.error.message).toBe("Neplatné přihlašovací údaje");
    });

    it("should return Czech message for 404 errors", async () => {
      const response = await request(app).get("/api/nonexistent");

      expect(response.body.error.message).toContain("nebyla nalezena");
    });

    it("should return Czech message for server errors", async () => {
      const response = await request(app).get("/api/test/server-error");

      expect(response.body.error.message).toBe("Interní chyba");
    });
  });

  describe("Successful Requests", () => {
    it("should not interfere with successful requests", async () => {
      const response = await request(app).get("/api/test/success");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: "Success",
      });
    });
  });
});
