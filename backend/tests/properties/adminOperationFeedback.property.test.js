import fc from "fast-check";
import request from "supertest";
import express from "express";
import fs from "fs/promises";
import path from "path";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query, testConnection, closePool } from "../../src/config/database.js";
import adminRoutes from "../../src/routes/admin.js";

// Feature: makeup-artist-website, Property 12: Admin operation feedback
// Validates: Requirements 8.3, 9.3

describe("Property 12: Admin operation feedback", () => {
  let app;
  let testUserId;
  let testToken;
  let testCategoryId;
  let testCategorySlug;
  const testUploadDir = "./uploads/test-property-12";

  beforeAll(async () => {
    // Ensure we're using test database
    process.env.NODE_ENV = "test";
    process.env.UPLOAD_DIR = testUploadDir;
    process.env.JWT_SECRET = "test-secret-key-for-property-12";
    await testConnection();

    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use("/api/admin", adminRoutes);

    // Create test user
    const testUsername = `test_feedback_user_${Date.now()}`;
    const passwordHash = await bcrypt.hash("testpass", 10);
    const userResult = await query(
      "INSERT INTO users (username, password_hash, email) VALUES ($1, $2, $3) RETURNING id",
      [testUsername, passwordHash, "test@feedback.com"]
    );
    testUserId = userResult.rows[0].id;

    // Generate JWT token for test user
    testToken = jwt.sign(
      { id: testUserId, username: testUsername },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Create test category
    testCategorySlug = `test-feedback-cat-${Date.now()}`;
    const categoryResult = await query(
      "INSERT INTO categories (name_cs, slug, display_order) VALUES ($1, $2, $3) RETURNING id",
      ["Test Feedback Category", testCategorySlug, 999]
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

  test("For any successful admin operation (image upload), the admin panel should display a confirmation message in Czech language", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          filename: fc
            .string({ minLength: 5, maxLength: 30 })
            .map((s) => s.replace(/[^a-zA-Z0-9._-]/g, "_") + ".jpg"),
          size: fc.integer({ min: 1000, max: 5000000 }),
          mimetype: fc.constantFrom(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
          ),
        }),
        async (fileData) => {
          // Create a small test image buffer
          const testImageBuffer = Buffer.from([
            0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46,
          ]);

          // Upload image
          const response = await request(app)
            .post("/api/admin/images")
            .set("Authorization", `Bearer ${testToken}`)
            .field("categoryId", testCategoryId.toString())
            .attach("image", testImageBuffer, fileData.filename);

          // Verify successful response
          expect(response.status).toBe(201);
          expect(response.body.success).toBe(true);

          // Verify confirmation message exists and is in Czech
          expect(response.body.message).toBeDefined();
          expect(typeof response.body.message).toBe("string");
          expect(response.body.message.length).toBeGreaterThan(0);

          // Verify message contains Czech confirmation keywords
          const czechConfirmationKeywords = [
            "úspěšně",
            "nahrán",
            "přidán",
            "vytvořen",
          ];
          const messageContainsCzechKeyword = czechConfirmationKeywords.some(
            (keyword) =>
              response.body.message
                .toLowerCase()
                .includes(keyword.toLowerCase())
          );
          expect(messageContainsCzechKeyword).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test("For any successful admin operation (image deletion), the admin panel should display a confirmation message in Czech language", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          filename: fc
            .string({ minLength: 5, maxLength: 30 })
            .map((s) => s.replace(/[^a-zA-Z0-9._-]/g, "_") + ".jpg"),
        }),
        async (fileData) => {
          // First, create an image to delete
          const testImageBuffer = Buffer.from([
            0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46,
          ]);

          const uploadResponse = await request(app)
            .post("/api/admin/images")
            .set("Authorization", `Bearer ${testToken}`)
            .field("categoryId", testCategoryId.toString())
            .attach("image", testImageBuffer, fileData.filename);

          expect(uploadResponse.status).toBe(201);
          const imageId = uploadResponse.body.data.id;

          // Now delete the image
          const deleteResponse = await request(app)
            .delete(`/api/admin/images/${imageId}`)
            .set("Authorization", `Bearer ${testToken}`);

          // Verify successful response
          expect(deleteResponse.status).toBe(200);
          expect(deleteResponse.body.success).toBe(true);

          // Verify confirmation message exists and is in Czech
          expect(deleteResponse.body.message).toBeDefined();
          expect(typeof deleteResponse.body.message).toBe("string");
          expect(deleteResponse.body.message.length).toBeGreaterThan(0);

          // Verify message contains Czech confirmation keywords
          const czechConfirmationKeywords = [
            "úspěšně",
            "smazán",
            "odstraněn",
            "vymazán",
          ];
          const messageContainsCzechKeyword = czechConfirmationKeywords.some(
            (keyword) =>
              deleteResponse.body.message
                .toLowerCase()
                .includes(keyword.toLowerCase())
          );
          expect(messageContainsCzechKeyword).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
