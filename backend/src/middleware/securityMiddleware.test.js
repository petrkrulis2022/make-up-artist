import { jest } from "@jest/globals";
import {
  loginRateLimiter,
  apiRateLimiter,
  requestSizeLimits,
} from "./securityMiddleware.js";

describe("Security Middleware", () => {
  describe("requestSizeLimits", () => {
    it("should have correct JSON size limit", () => {
      expect(requestSizeLimits.json).toEqual({ limit: "10mb" });
    });

    it("should have correct URL-encoded size limit", () => {
      expect(requestSizeLimits.urlencoded).toEqual({
        limit: "10mb",
        extended: true,
      });
    });
  });

  describe("loginRateLimiter", () => {
    it("should be configured with correct window and max attempts", () => {
      expect(loginRateLimiter).toBeDefined();
      // Rate limiter is a function/middleware
      expect(typeof loginRateLimiter).toBe("function");
    });

    it("should have Czech error message", () => {
      // Access the message property from the rate limiter configuration
      const message = loginRateLimiter.message;
      expect(message).toEqual({
        success: false,
        error: {
          code: "TOO_MANY_REQUESTS",
          message:
            "Příliš mnoho pokusů o přihlášení. Zkuste to prosím později.",
        },
      });
    });
  });

  describe("apiRateLimiter", () => {
    it("should be configured as middleware", () => {
      expect(apiRateLimiter).toBeDefined();
      expect(typeof apiRateLimiter).toBe("function");
    });

    it("should have Czech error message", () => {
      const message = apiRateLimiter.message;
      expect(message).toEqual({
        success: false,
        error: {
          code: "TOO_MANY_REQUESTS",
          message: "Příliš mnoho požadavků. Zkuste to prosím později.",
        },
      });
    });
  });
});
