import fc from "fast-check";
import request from "supertest";
import app from "../../src/server.js";
import { query, testConnection, closePool } from "../../src/config/database.js";
import { hashPassword } from "../../src/services/authService.js";

// Feature: makeup-artist-website, Property 7: Authentication rejection
// Validates: Requirements 7.2

describe("Property 7: Authentication rejection", () => {
  let testUserId;
  const testUsername = "test_auth_user";
  const testPassword = "correctPassword123";

  beforeAll(async () => {
    // Ensure we're using test database
    process.env.NODE_ENV = "test";
    await testConnection();

    // Create a test user with known credentials
    const passwordHash = await hashPassword(testPassword);
    const result = await query(
      "INSERT INTO users (username, password_hash, email) VALUES ($1, $2, $3) RETURNING id",
      [testUsername, passwordHash, "test@test.com"]
    );
    testUserId = result.rows[0].id;
  });

  afterAll(async () => {
    // Cleanup test user
    if (testUserId) {
      await query("DELETE FROM users WHERE id = $1", [testUserId]);
    }
    await closePool();
  });

  test("For any invalid username, the authentication system should deny access and display error in Czech", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .string({ minLength: 3, maxLength: 20 })
          .filter((s) => s !== testUsername && /^[a-zA-Z0-9_]+$/.test(s)),
        async (invalidUsername) => {
          const response = await request(app).post("/api/auth/login").send({
            username: invalidUsername,
            password: testPassword,
          });

          // Verify authentication is denied
          expect(response.status).toBe(401);
          expect(response.body.success).toBe(false);
          expect(response.body.error).toBeDefined();
          expect(response.body.error.code).toBe("INVALID_CREDENTIALS");

          // Verify error message is in Czech
          expect(response.body.error.message).toBe(
            "Neplatné přihlašovací údaje"
          );

          // Verify no token is returned
          expect(response.body.data).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  test("For any invalid password, the authentication system should deny access and display error in Czech", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .string({ minLength: 6, maxLength: 30 })
          .filter((s) => s !== testPassword),
        async (invalidPassword) => {
          const response = await request(app).post("/api/auth/login").send({
            username: testUsername,
            password: invalidPassword,
          });

          // Verify authentication is denied
          expect(response.status).toBe(401);
          expect(response.body.success).toBe(false);
          expect(response.body.error).toBeDefined();
          expect(response.body.error.code).toBe("INVALID_CREDENTIALS");

          // Verify error message is in Czech
          expect(response.body.error.message).toBe(
            "Neplatné přihlašovací údaje"
          );

          // Verify no token is returned
          expect(response.body.data).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  test("For any combination of invalid username and password, the authentication system should deny access", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          username: fc
            .string({ minLength: 3, maxLength: 20 })
            .filter((s) => s !== testUsername && /^[a-zA-Z0-9_]+$/.test(s)),
          password: fc
            .string({ minLength: 6, maxLength: 30 })
            .filter((s) => s !== testPassword),
        }),
        async (credentials) => {
          const response = await request(app).post("/api/auth/login").send({
            username: credentials.username,
            password: credentials.password,
          });

          // Verify authentication is denied
          expect(response.status).toBe(401);
          expect(response.body.success).toBe(false);
          expect(response.body.error).toBeDefined();
          expect(response.body.error.code).toBe("INVALID_CREDENTIALS");

          // Verify error message is in Czech
          expect(response.body.error.message).toBe(
            "Neplatné přihlašovací údaje"
          );

          // Verify no token is returned
          expect(response.body.data).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  test("For any request with missing credentials, the authentication system should return appropriate error in Czech", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          { username: testUsername }, // Missing password
          { password: testPassword }, // Missing username
          {} // Missing both
        ),
        async (incompleteCredentials) => {
          const response = await request(app)
            .post("/api/auth/login")
            .send(incompleteCredentials);

          // Verify request is rejected
          expect(response.status).toBe(400);
          expect(response.body.success).toBe(false);
          expect(response.body.error).toBeDefined();
          expect(response.body.error.code).toBe("MISSING_CREDENTIALS");

          // Verify error message is in Czech
          expect(response.body.error.message).toBe(
            "Uživatelské jméno a heslo jsou povinné"
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
