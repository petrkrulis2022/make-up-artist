import fc from "fast-check";
import { query, testConnection, closePool } from "../../src/config/database.js";
import bcrypt from "bcrypt";

// Feature: makeup-artist-website, Property 19: Database query accuracy
// Validates: Requirements 12.3

describe("Property 19: Database query accuracy", () => {
  beforeAll(async () => {
    // Ensure we're using test database
    process.env.NODE_ENV = "test";
    await testConnection();
  });

  afterAll(async () => {
    await closePool();
  });

  test("For any user query, the returned data should accurately reflect the current database state", async () => {
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
          const testUsername = `test_query_${userData.username}_${Date.now()}`;

          try {
            // Insert user
            const passwordHash = await bcrypt.hash(userData.password, 10);
            const insertResult = await query(
              "INSERT INTO users (username, password_hash, email) VALUES ($1, $2, $3) RETURNING id, username, email, created_at",
              [testUsername, passwordHash, userData.email]
            );

            const insertedUser = insertResult.rows[0];

            // Query by ID
            const queryById = await query(
              "SELECT id, username, email, created_at FROM users WHERE id = $1",
              [insertedUser.id]
            );

            // Verify query returns accurate data
            expect(queryById.rows.length).toBe(1);
            expect(queryById.rows[0].id).toBe(insertedUser.id);
            expect(queryById.rows[0].username).toBe(testUsername);
            expect(queryById.rows[0].email).toBe(userData.email);

            // Query by username
            const queryByUsername = await query(
              "SELECT id, username, email FROM users WHERE username = $1",
              [testUsername]
            );

            // Verify query returns same accurate data
            expect(queryByUsername.rows.length).toBe(1);
            expect(queryByUsername.rows[0].id).toBe(insertedUser.id);
            expect(queryByUsername.rows[0].username).toBe(testUsername);

            // Cleanup
            await query("DELETE FROM users WHERE username = $1", [
              testUsername,
            ]);
          } catch (error) {
            await query("DELETE FROM users WHERE username = $1", [
              testUsername,
            ]);
            throw error;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test("For any category query with filters, the returned data should match the filter criteria", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            name_cs: fc.string({ minLength: 5, maxLength: 50 }),
            display_order: fc.integer({ min: 1, max: 100 }),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (categoriesData) => {
          const testSlugs = [];

          try {
            // Insert multiple categories
            for (let i = 0; i < categoriesData.length; i++) {
              const testSlug = `test-query-cat-${Date.now()}-${i}-${Math.random()
                .toString(36)
                .substring(7)}`;
              testSlugs.push(testSlug);

              await query(
                "INSERT INTO categories (name_cs, slug, display_order) VALUES ($1, $2, $3)",
                [
                  categoriesData[i].name_cs,
                  testSlug,
                  categoriesData[i].display_order,
                ]
              );
            }

            // Query all inserted categories
            const allCategories = await query(
              "SELECT * FROM categories WHERE slug = ANY($1::text[])",
              [testSlugs]
            );

            // Verify all categories are returned
            expect(allCategories.rows.length).toBe(categoriesData.length);

            // Query with ORDER BY display_order
            const orderedCategories = await query(
              "SELECT * FROM categories WHERE slug = ANY($1::text[]) ORDER BY display_order ASC",
              [testSlugs]
            );

            // Verify ordering is accurate
            for (let i = 0; i < orderedCategories.rows.length - 1; i++) {
              expect(
                orderedCategories.rows[i].display_order
              ).toBeLessThanOrEqual(
                orderedCategories.rows[i + 1].display_order
              );
            }

            // Query with specific display_order filter
            const minOrder = Math.min(
              ...categoriesData.map((c) => c.display_order)
            );
            const filteredCategories = await query(
              "SELECT * FROM categories WHERE slug = ANY($1::text[]) AND display_order >= $2",
              [testSlugs, minOrder]
            );

            // Verify filter is accurate
            filteredCategories.rows.forEach((row) => {
              expect(row.display_order).toBeGreaterThanOrEqual(minOrder);
            });

            // Cleanup
            for (const slug of testSlugs) {
              await query("DELETE FROM categories WHERE slug = $1", [slug]);
            }
          } catch (error) {
            // Cleanup on error
            for (const slug of testSlugs) {
              await query("DELETE FROM categories WHERE slug = $1", [slug]);
            }
            throw error;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test("For any image query by category, the returned images should only belong to that category", async () => {
    // Setup: Create test user and multiple categories
    const testUsername = `test_img_query_user_${Date.now()}`;
    const testCategorySlugs = [
      `test-img-query-cat1-${Date.now()}`,
      `test-img-query-cat2-${Date.now()}`,
    ];

    const passwordHash = await bcrypt.hash("testpass", 10);
    const userResult = await query(
      "INSERT INTO users (username, password_hash, email) VALUES ($1, $2, $3) RETURNING id",
      [testUsername, passwordHash, "test@test.com"]
    );
    const testUserId = userResult.rows[0].id;

    const categoryIds = [];
    for (const slug of testCategorySlugs) {
      const categoryResult = await query(
        "INSERT INTO categories (name_cs, slug, display_order) VALUES ($1, $2, $3) RETURNING id",
        [`Test Category ${slug}`, slug, 999]
      );
      categoryIds.push(categoryResult.rows[0].id);
    }

    try {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              categoryIndex: fc.integer({ min: 0, max: 1 }),
              filename: fc
                .string({ minLength: 5, maxLength: 30 })
                .map((s) => s.replace(/[^a-zA-Z0-9._-]/g, "_")),
              file_size: fc.integer({ min: 1000, max: 5000000 }),
              mime_type: fc.constantFrom(
                "image/jpeg",
                "image/png",
                "image/webp"
              ),
            }),
            { minLength: 3, maxLength: 10 }
          ),
          async (imagesData) => {
            const imageIds = [];

            try {
              // Insert images into different categories
              for (const imageData of imagesData) {
                const categoryId = categoryIds[imageData.categoryIndex];
                const file_path = `/uploads/test/${imageData.filename}`;

                const insertResult = await query(
                  "INSERT INTO images (category_id, filename, original_filename, file_path, file_size, mime_type, uploaded_by, display_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
                  [
                    categoryId,
                    imageData.filename,
                    imageData.filename,
                    file_path,
                    imageData.file_size,
                    imageData.mime_type,
                    testUserId,
                    0,
                  ]
                );

                imageIds.push(insertResult.rows[0].id);
              }

              // Query images for first category
              const category1Images = await query(
                "SELECT * FROM images WHERE category_id = $1 AND id = ANY($2::int[])",
                [categoryIds[0], imageIds]
              );

              // Verify all returned images belong to category 1
              category1Images.rows.forEach((row) => {
                expect(row.category_id).toBe(categoryIds[0]);
              });

              // Query images for second category
              const category2Images = await query(
                "SELECT * FROM images WHERE category_id = $1 AND id = ANY($2::int[])",
                [categoryIds[1], imageIds]
              );

              // Verify all returned images belong to category 2
              category2Images.rows.forEach((row) => {
                expect(row.category_id).toBe(categoryIds[1]);
              });

              // Verify total count matches
              const expectedCategory1Count = imagesData.filter(
                (img) => img.categoryIndex === 0
              ).length;
              const expectedCategory2Count = imagesData.filter(
                (img) => img.categoryIndex === 1
              ).length;

              expect(category1Images.rows.length).toBe(expectedCategory1Count);
              expect(category2Images.rows.length).toBe(expectedCategory2Count);

              // Cleanup images
              for (const imageId of imageIds) {
                await query("DELETE FROM images WHERE id = $1", [imageId]);
              }
            } catch (error) {
              // Cleanup on error
              for (const imageId of imageIds) {
                await query("DELETE FROM images WHERE id = $1", [imageId]);
              }
              throw error;
            }
          }
        ),
        { numRuns: 100 }
      );
    } finally {
      // Cleanup test data
      await query("DELETE FROM images WHERE uploaded_by = $1", [testUserId]);
      await query("DELETE FROM users WHERE username = $1", [testUsername]);
      for (const slug of testCategorySlugs) {
        await query("DELETE FROM categories WHERE slug = $1", [slug]);
      }
    }
  });

  test("For any COUNT query, the returned count should accurately reflect the number of matching rows", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        async (numCategories) => {
          const testSlugs = [];

          try {
            // Insert a specific number of categories
            for (let i = 0; i < numCategories; i++) {
              const testSlug = `test-count-cat-${Date.now()}-${i}-${Math.random()
                .toString(36)
                .substring(7)}`;
              testSlugs.push(testSlug);

              await query(
                "INSERT INTO categories (name_cs, slug, display_order) VALUES ($1, $2, $3)",
                [`Test Count Category ${i}`, testSlug, i]
              );
            }

            // Query count
            const countResult = await query(
              "SELECT COUNT(*) as count FROM categories WHERE slug = ANY($1::text[])",
              [testSlugs]
            );

            // Verify count is accurate
            expect(parseInt(countResult.rows[0].count)).toBe(numCategories);

            // Cleanup
            for (const slug of testSlugs) {
              await query("DELETE FROM categories WHERE slug = $1", [slug]);
            }
          } catch (error) {
            // Cleanup on error
            for (const slug of testSlugs) {
              await query("DELETE FROM categories WHERE slug = $1", [slug]);
            }
            throw error;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
