import fc from "fast-check";
import request from "supertest";
import app from "../../src/server.js";
import { query, testConnection, closePool } from "../../src/config/database.js";

// Feature: makeup-artist-website, Property 8: Protected route access control
// Validates: Requirements 7.5

describe("Property 8: Protected route access control", () => {
  beforeAll(async () => {
    // Ensure we're using test database
    process.env.NODE_ENV = "test";
    await testConnection();
  });

  afterAll(async () => {
    await closePool();
  });

  // Define all protected admin routes
  const protectedRoutes = [
    { method: "get", path: "/api/admin/images" },
    { method: "post", path: "/api/admin/images" },
    { method: "delete", path: "/api/admin/images/1" },
  ];

  test("For any protected admin route accessed without authentication token, the system should return 401 unauthorized", async () => {
    await fc.assert(
      fc.asyncProperty(fc.constantFrom(...protectedRoutes), async (route) => {
        let response;

        // Make request without Authorization header
        if (route.method === "get") {
          response = await request(app).get(route.path);
        } else if (route.method === "post") {
          response = await request(app).post(route.path).send({});
        } else if (route.method === "delete") {
          response = await request(app).delete(route.path);
        }

        // Verify access is denied
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
        expect(response.body.error.code).toBe("NO_TOKEN");

        // Verify error message is in Czech
        expect(response.body.error.message).toBe(
          "Přístupový token nebyl poskytnut"
        );
      }),
      { numRuns: 100 }
    );
  });

  test("For any protected admin route accessed with invalid token, the system should return 401 unauthorized", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          route: fc.constantFrom(...protectedRoutes),
          invalidToken: fc.string({ minLength: 10, maxLength: 100 }),
        }),
        async ({ route, invalidToken }) => {
          let response;

          // Make request with invalid Authorization header
          if (route.method === "get") {
            response = await request(app)
              .get(route.path)
              .set("Authorization", `Bearer ${invalidToken}`);
          } else if (route.method === "post") {
            response = await request(app)
              .post(route.path)
              .set("Authorization", `Bearer ${invalidToken}`)
              .send({});
          } else if (route.method === "delete") {
            response = await request(app)
              .delete(route.path)
              .set("Authorization", `Bearer ${invalidToken}`);
          }

          // Verify access is denied
          expect(response.status).toBe(401);
          expect(response.body.success).toBe(false);
          expect(response.body.error).toBeDefined();

          // Should be either INVALID_TOKEN or AUTH_ERROR
          expect(["INVALID_TOKEN", "AUTH_ERROR"]).toContain(
            response.body.error.code
          );

          // Verify error message is in Czech
          expect(response.body.error.message).toBeDefined();
          expect(typeof response.body.error.message).toBe("string");
        }
      ),
      { numRuns: 100 }
    );
  });

  test("For any protected admin route accessed with malformed Authorization header, the system should return 401 unauthorized", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          route: fc.constantFrom(...protectedRoutes),
          malformedHeader: fc.constantFrom(
            "InvalidFormat",
            "Bearer",
            "Bearer ",
            "NotBearer token123",
            ""
          ),
        }),
        async ({ route, malformedHeader }) => {
          let response;

          // Make request with malformed Authorization header
          if (route.method === "get") {
            response = await request(app)
              .get(route.path)
              .set("Authorization", malformedHeader);
          } else if (route.method === "post") {
            response = await request(app)
              .post(route.path)
              .set("Authorization", malformedHeader)
              .send({});
          } else if (route.method === "delete") {
            response = await request(app)
              .delete(route.path)
              .set("Authorization", malformedHeader);
          }

          // Verify access is denied
          expect(response.status).toBe(401);
          expect(response.body.success).toBe(false);
          expect(response.body.error).toBeDefined();

          // Verify error message is in Czech
          expect(response.body.error.message).toBeDefined();
          expect(typeof response.body.error.message).toBe("string");
        }
      ),
      { numRuns: 100 }
    );
  });
});
