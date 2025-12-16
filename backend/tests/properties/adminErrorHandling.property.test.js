import fc from "fast-check";
import request from "supertest";
import express from "express";
import fs from "fs/promises";
import path from "path";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query, testConnection, closePool } from "../../src/config/database.js";
import adminRoutes from "../../src/routes/admin.js";

// Feature: makeup-artist-website, Property 13: Admin error handling
// Validates: Requirements 8.4, 9.4

describe("Property 13: Admin error handling", () => {
  let app;
  let testUserId;
  let testToken;
  let testCategoryId;
  let testCategorySlug;
  const testUploadDir = "./uploads/test-property-13";

  beforeAll(async () => {
    // Ensure we're using test database
    process.env.NODE_ENV = "test";
    process.env.UPLOAD_DIR = testUploadDir;
    process.env.JWT_SECRET = "test-secret-key-for-property-13";
    await testConnection();

    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use("/api/admin", adminRoutes);

    // Create test user
    const testUsername = `test_error_user_${Date.now()}`;
    const passwordHash = await bcrypt.hash("testpass", 10);
    const userResult = await query(
      "INSERT INTO users (username, password_hash, email) VALUES ($1, $2, $3) RETURNING id",
      [testUsername, passwordHash, "test@error.com"]
    );
    testUserId = userResult.rows[0].id;

    // Generate JWT token for test user
    testToken = jwt.sign(
      { id: testUserId, username: testUsername },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Create test category
    testCategorySlug = `test-error-cat-${Date.now()}`;
    const categoryResult = await query(
      "INSERT INTO categories (name_cs, slug, display_order) VALUES ($1, $2, $3) RETURNING id",
      ["Test Error Category", testCategorySlug, 999]
    );
    testCategoryId = categoryResult.rows[0].id;

    // Create test upload directory
    await fs.mkdir(testUploadDir, { recursive: true });
  });

  afterAll(async () => {
    // Cleanup test data
    await query("DELETE FROM images WHERE uploaded_by = $1", [testUserId]);
    await query("DELETE FROM users WHERE id = $1", [testUserId]);
    await query("DELETE FROM categories WHERE id = $1", [testCategoryId]);

    // Cleanup test upload directory
    try {
      await fs.rm(testUploadDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }

    await closePool();
  });

  afterEach(async () => {
    // Cleanup images created during test
    await query("DELETE FROM images WHERE uploaded_by = $1", [testUserId]);

    // Cleanup uploaded files
    try {
      const categoryDir = path.join(testUploadDir, testCategorySlug);
      const files = await fs.readdir(categoryDir);
      for (const file of files) {
        await fs.unlink(path.join(categoryDir, file));
      }
    } catch (error) {
      // Ignore if directory doesn't exist
    }
  });

  test("For any failed admin operation (upload with missing file), the admin panel should display an error message in Czech language", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 4 }), async (categoryId) => {
        // Attempt to upload without a file
        const response = await request(app)
          .post("/api/admin/images")
          .set("Authorization", `Bearer ${testToken}`)
          .field("categoryId", categoryId.toString());

        // Verify error response
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.body.success).toBe(false);

        // Verify error message exists and is in Czech
        expect(response.body.error).toBeDefined();
        expect(response.body.error.message).toBeDefined();
        expect(typeof response.body.error.message).toBe("string");
        expect(response.body.error.message.length).toBeGreaterThan(0);

        // Verify message contains Czech error keywords
        const czechErrorKeywords = [
          "chyba",
          "nebyl",
          "není",
          "neplatný",
          "selhalo",
          "nelze",
        ];
        const messageContainsCzechKeyword = czechErrorKeywords.some((keyword) =>
          response.body.error.message
            .toLowerCase()
            .includes(keyword.toLowerCase())
        );
        expect(messageContainsCzechKeyword).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  test("For any failed admin operation (upload with invalid category), the admin panel should display an error message in Czech language", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 9999, max: 99999 }), // Non-existent category IDs
        async (invalidCategoryId) => {
          const testImageBuffer = Buffer.from([
            0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46,
          ]);

          // Attempt to upload with invalid category
          const response = await request(app)
            .post("/api/admin/images")
            .set("Authorization", `Bearer ${testToken}`)
            .field("categoryId", invalidCategoryId.toString())
            .attach("image", testImageBuffer, "test.jpg");

          // Verify error response
          expect(response.status).toBeGreaterThanOrEqual(400);
          expect(response.body.success).toBe(false);

          // Verify error message exists and is in Czech
          expect(response.body.error).toBeDefined();
          expect(response.body.error.message).toBeDefined();
          expect(typeof response.body.error.message).toBe("string");
          expect(response.body.error.message.length).toBeGreaterThan(0);

          // Verify message contains Czech error keywords
          const czechErrorKeywords = [
            "chyba",
            "nebyl",
            "není",
            "neplatný",
            "nenalezen",
            "kategorie",
          ];
          const messageContainsCzechKeyword = czechErrorKeywords.some(
            (keyword) =>
              response.body.error.message
                .toLowerCase()
                .includes(keyword.toLowerCase())
          );
          expect(messageContainsCzechKeyword).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test("For any failed admin operation (delete non-existent image), the admin panel should display an error message in Czech language", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 9999, max: 99999 }), // Non-existent image IDs
        async (invalidImageId) => {
          // Attempt to delete non-existent image
          const response = await request(app)
            .delete(`/api/admin/images/${invalidImageId}`)
            .set("Authorization", `Bearer ${testToken}`);

          // Verify error response
          expect(response.status).toBeGreaterThanOrEqual(400);
          expect(response.body.success).toBe(false);

          // Verify error message exists and is in Czech
          expect(response.body.error).toBeDefined();
          expect(response.body.error.message).toBeDefined();
          expect(typeof response.body.error.message).toBe("string");
          expect(response.body.error.message.length).toBeGreaterThan(0);

          // Verify message contains Czech error keywords
          const czechErrorKeywords = [
            "chyba",
            "nebyl",
            "není",
            "neplatný",
            "nenalezen",
            "obrázek",
          ];
          const messageContainsCzechKeyword = czechErrorKeywords.some(
            (keyword) =>
              response.body.error.message
                .toLowerCase()
                .includes(keyword.toLowerCase())
          );
          expect(messageContainsCzechKeyword).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test("For any failed admin operation (upload without authentication), the admin panel should display an error message in Czech language", async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        const testImageBuffer = Buffer.from([
          0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46,
        ]);

        // Attempt to upload without authentication token
        const response = await request(app)
          .post("/api/admin/images")
          .field("categoryId", testCategoryId.toString())
          .attach("image", testImageBuffer, "test.jpg");

        // Verify error response
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.body.success).toBe(false);

        // Verify error message exists and is in Czech
        expect(response.body.error).toBeDefined();
        expect(response.body.error.message).toBeDefined();
        expect(typeof response.body.error.message).toBe("string");
        expect(response.body.error.message.length).toBeGreaterThan(0);

        // Verify message contains Czech error keywords
        const czechErrorKeywords = [
          "chyba",
          "token",
          "přihlášení",
          "autentizace",
          "oprávnění",
        ];
        const messageContainsCzechKeyword = czechErrorKeywords.some((keyword) =>
          response.body.error.message
            .toLowerCase()
            .includes(keyword.toLowerCase())
        );
        expect(messageContainsCzechKeyword).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
