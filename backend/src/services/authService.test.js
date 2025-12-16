import {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
} from "./authService.js";

describe("Authentication Service", () => {
  describe("hashPassword", () => {
    test("should hash a password successfully", async () => {
      const password = "testPassword123";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBe(60); // bcrypt hashes are 60 characters
      expect(hash).toMatch(/^\$2[ab]\$/); // bcrypt hash format
    });

    test("should produce different hashes for the same password", async () => {
      const password = "testPassword123";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    test("should use minimum 10 rounds", async () => {
      const password = "testPassword123";
      const hash = await hashPassword(password);

      // Extract cost factor from hash
      const costFactorMatch = hash.match(/^\$2[ab]\$(\d+)\$/);
      const costFactor = parseInt(costFactorMatch[1]);

      expect(costFactor).toBeGreaterThanOrEqual(10);
    });
  });

  describe("comparePassword", () => {
    test("should correctly validate a matching password", async () => {
      const password = "testPassword123";
      const hash = await hashPassword(password);

      const isMatch = await comparePassword(password, hash);

      expect(isMatch).toBe(true);
    });

    test("should reject a non-matching password", async () => {
      const password = "testPassword123";
      const wrongPassword = "wrongPassword456";
      const hash = await hashPassword(password);

      const isMatch = await comparePassword(wrongPassword, hash);

      expect(isMatch).toBe(false);
    });

    test("should handle empty password", async () => {
      const password = "testPassword123";
      const hash = await hashPassword(password);

      const isMatch = await comparePassword("", hash);

      expect(isMatch).toBe(false);
    });
  });

  describe("generateToken", () => {
    test("should generate a valid JWT token", () => {
      const payload = {
        id: 1,
        username: "testuser",
        email: "test@test.com",
      };

      const token = generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3); // JWT has 3 parts
    });

    test("should include payload data in token", () => {
      const payload = {
        id: 1,
        username: "testuser",
        email: "test@test.com",
      };

      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded.id).toBe(payload.id);
      expect(decoded.username).toBe(payload.username);
      expect(decoded.email).toBe(payload.email);
    });

    test("should throw error if JWT_SECRET is not defined", () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      const payload = { id: 1, username: "testuser" };

      expect(() => generateToken(payload)).toThrow();

      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe("verifyToken", () => {
    test("should verify and decode a valid token", () => {
      const payload = {
        id: 1,
        username: "testuser",
        email: "test@test.com",
      };

      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(payload.id);
      expect(decoded.username).toBe(payload.username);
      expect(decoded.email).toBe(payload.email);
    });

    test("should throw error for invalid token", () => {
      const invalidToken = "invalid.token.here";

      expect(() => verifyToken(invalidToken)).toThrow("Invalid token");
    });

    test("should throw error for malformed token", () => {
      const malformedToken = "notavalidtoken";

      expect(() => verifyToken(malformedToken)).toThrow();
    });

    test("should throw error if JWT_SECRET is not defined", () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      const token = "some.token.here";

      expect(() => verifyToken(token)).toThrow();

      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe("Token expiration", () => {
    test("should include expiration in token", () => {
      const payload = {
        id: 1,
        username: "testuser",
        email: "test@test.com",
      };

      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });
  });
});
