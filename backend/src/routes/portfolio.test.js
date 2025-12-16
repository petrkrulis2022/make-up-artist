import request from "supertest";
import app from "../server.js";
import { query, testConnection, closePool } from "../config/database.js";

describe("Portfolio API Endpoints", () => {
  let testCategoryIds = [];
  let testImageIds = [];

  beforeAll(async () => {
    // Ensure we're using test database
    process.env.NODE_ENV = "test";
    await testConnection();

    // Get existing categories (should be seeded)
    const categoriesResult = await query(
      "SELECT id FROM categories ORDER BY display_order ASC"
    );
    testCategoryIds = categoriesResult.rows.map((row) => row.id);
  });

  afterAll(async () => {
    // Cleanup any test images created
    if (testImageIds.length > 0) {
      await query(`DELETE FROM images WHERE id = ANY($1)`, [testImageIds]);
    }
    await closePool();
  });

  describe("GET /api/portfolio/categories", () => {
    test("should return all four categories", async () => {
      const response = await request(app).get("/api/portfolio/categories");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(4);

      // Verify each category has required fields
      response.body.data.forEach((category) => {
        expect(category).toHaveProperty("id");
        expect(category).toHaveProperty("name_cs");
        expect(category).toHaveProperty("slug");
        expect(category).toHaveProperty("display_order");
      });

      // Verify categories are in correct order
      const displayOrders = response.body.data.map((c) => c.display_order);
      expect(displayOrders).toEqual([1, 2, 3, 4]);

      // Verify category names (in Czech)
      const categoryNames = response.body.data.map((c) => c.name_cs);
      expect(categoryNames).toContain("Svatební líčení");
      expect(categoryNames).toContain("Líčení na plesy a večírky");
      expect(categoryNames).toContain("Slavnostní líčení");
      expect(categoryNames).toContain("Líčení pro focení");
    });
  });

  describe("GET /api/portfolio/images/:categoryId", () => {
    test("should return correct images for a valid category", async () => {
      // Use the first category ID
      const categoryId = testCategoryIds[0];

      const response = await request(app).get(
        `/api/portfolio/images/${categoryId}`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);

      // If there are images, verify they all belong to the requested category
      if (response.body.data.length > 0) {
        response.body.data.forEach((image) => {
          expect(image.category_id).toBe(categoryId);
          expect(image).toHaveProperty("id");
          expect(image).toHaveProperty("filename");
          expect(image).toHaveProperty("file_path");
        });
      }
    });

    test("should return empty array for category with no images", async () => {
      // Use a category that likely has no images
      const categoryId = testCategoryIds[testCategoryIds.length - 1];

      const response = await request(app).get(
        `/api/portfolio/images/${categoryId}`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      // May be empty or have images, both are valid
    });

    test("should return error for invalid category ID (non-numeric)", async () => {
      const response = await request(app).get("/api/portfolio/images/invalid");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe("INVALID_CATEGORY_ID");
      expect(response.body.error.message).toBe("Neplatné ID kategorie");
    });

    test("should return error for non-existent category ID", async () => {
      const nonExistentId = 99999;

      const response = await request(app).get(
        `/api/portfolio/images/${nonExistentId}`
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe("CATEGORY_NOT_FOUND");
      expect(response.body.error.message).toBe("Kategorie nebyla nalezena");
    });

    test("should return error for negative category ID", async () => {
      const response = await request(app).get("/api/portfolio/images/-1");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe("CATEGORY_NOT_FOUND");
    });

    test("should return error for zero category ID", async () => {
      const response = await request(app).get("/api/portfolio/images/0");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe("CATEGORY_NOT_FOUND");
    });
  });
});
