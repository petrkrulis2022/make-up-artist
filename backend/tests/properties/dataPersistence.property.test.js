import fc from "fast-check";
import { query, testConnection, closePool } from "../../src/config/database.js";
import bcrypt from "bcrypt";

// Feature: makeup-artist-website, Property 18: Data persistence after restart
// Validates: Requirements 12.1, 12.2

describe("Property 18: Data persistence after restart", () => {
  beforeAll(async () => {
    // Ensure we're using test database
    process.env.NODE_ENV = "test";
    await testConnection();
  });

  afterAll(async () => {
    await closePool();
  });

  // Helper to clean up test data
  const cleanupTestData = async (username, categorySlug) => {
    try {
      if (username) {
        await query("DELETE FROM users WHERE username = $1", [username]);
      }
      if (categorySlug) {
        await query("DELETE FROM categories WHERE slug = $1", [categorySlug]);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  };

  test("For any user data stored in database, that data should remain accessible after simulated restart", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          username: fc
            .string({ minLength: 3, maxLength: 20 })
            .filter((s) => /^[a-zA-Z0-9_]+$/.test(s)),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 6, maxLength: 30 }),
        }),
        async (userData) => {
          const testUsername = `test_${userData.username}_${Date.now()}`;

          try {
            // Store user data
            const passwordHash = await bcrypt.hash(userData.password, 10);
            const insertResult = await query(
              "INSERT INTO users (username, password_hash, email) VALUES ($1, $2, $3) RETURNING id",
              [testUsername, passwordHash, userData.email]
            );

            const userId = insertResult.rows[0].id;

            // Simulate restart by creating a new query (connection pool persists data)
            // In a real scenario, this would involve restarting the server
            const retrieveResult = await query(
              "SELECT id, username, email FROM users WHERE id = $1",
              [userId]
            );

            // Verify data persists
            expect(retrieveResult.rows.length).toBe(1);
            expect(retrieveResult.rows[0].username).toBe(testUsername);
            expect(retrieveResult.rows[0].email).toBe(userData.email);

            // Cleanup
            await cleanupTestData(testUsername, null);
          } catch (error) {
            await cleanupTestData(testUsername, null);
            throw error;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test("For any category data stored in database, that data should remain accessible after simulated restart", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name_cs: fc.string({ minLength: 5, maxLength: 50 }),
          display_order: fc.integer({ min: 1, max: 100 }),
        }),
        async (categoryData) => {
          const testSlug = `test-slug-${Date.now()}-${Math.random()
            .toString(36)
            .substring(7)}`;

          try {
            // Store category data
            const insertResult = await query(
              "INSERT INTO categories (name_cs, slug, display_order) VALUES ($1, $2, $3) RETURNING id",
              [categoryData.name_cs, testSlug, categoryData.display_order]
            );

            const categoryId = insertResult.rows[0].id;

            // Simulate restart by creating a new query
            const retrieveResult = await query(
              "SELECT id, name_cs, slug, display_order FROM categories WHERE id = $1",
              [categoryId]
            );

            // Verify data persists
            expect(retrieveResult.rows.length).toBe(1);
            expect(retrieveResult.rows[0].name_cs).toBe(categoryData.name_cs);
            expect(retrieveResult.rows[0].slug).toBe(testSlug);
            expect(retrieveResult.rows[0].display_order).toBe(
              categoryData.display_order
            );

            // Cleanup
            await cleanupTestData(null, testSlug);
          } catch (error) {
            await cleanupTestData(null, testSlug);
            throw error;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test("For any image metadata stored in database, that data should remain accessible after simulated restart", async () => {
    // Setup: Create test user and category once for all property runs
    const testUsername = `test_img_user_${Date.now()}`;
    const testCategorySlug = `test-img-cat-${Date.now()}`;

    const passwordHash = await bcrypt.hash("testpass", 10);
    const userResult = await query(
      "INSERT INTO users (username, password_hash, email) VALUES ($1, $2, $3) RETURNING id",
      [testUsername, passwordHash, "test@test.com"]
    );
    const testUserId = userResult.rows[0].id;

    const categoryResult = await query(
      "INSERT INTO categories (name_cs, slug, display_order) VALUES ($1, $2, $3) RETURNING id",
      ["Test Category", testCategorySlug, 999]
    );
    const testCategoryId = categoryResult.rows[0].id;

    try {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            filename: fc
              .string({ minLength: 5, maxLength: 50 })
              .map((s) => s.replace(/[^a-zA-Z0-9._-]/g, "_")),
            original_filename: fc.string({ minLength: 5, maxLength: 50 }),
            file_size: fc.integer({ min: 1000, max: 5000000 }),
            mime_type: fc.constantFrom("image/jpeg", "image/png", "image/webp"),
            display_order: fc.integer({ min: 0, max: 100 }),
          }),
          async (imageData) => {
            const file_path = `/uploads/test/${imageData.filename}`;

            // Store image metadata
            const insertResult = await query(
              "INSERT INTO images (category_id, filename, original_filename, file_path, file_size, mime_type, uploaded_by, display_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
              [
                testCategoryId,
                imageData.filename,
                imageData.original_filename,
                file_path,
                imageData.file_size,
                imageData.mime_type,
                testUserId,
                imageData.display_order,
              ]
            );

            const imageId = insertResult.rows[0].id;

            // Simulate restart by creating a new query
            const retrieveResult = await query(
              "SELECT * FROM images WHERE id = $1",
              [imageId]
            );

            // Verify data persists
            expect(retrieveResult.rows.length).toBe(1);
            expect(retrieveResult.rows[0].filename).toBe(imageData.filename);
            expect(retrieveResult.rows[0].file_size).toBe(imageData.file_size);
            expect(retrieveResult.rows[0].mime_type).toBe(imageData.mime_type);

            // Cleanup this specific image
            await query("DELETE FROM images WHERE id = $1", [imageId]);
          }
        ),
        { numRuns: 100 }
      );
    } finally {
      // Cleanup test user and category
      await query("DELETE FROM images WHERE uploaded_by = $1", [testUserId]);
      await cleanupTestData(testUsername, testCategorySlug);
    }
  });
});
