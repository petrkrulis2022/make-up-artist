import fc from "fast-check";
import fs from "fs/promises";
import path from "path";
import {
  saveImageFile,
  createImageRecord,
  deleteImage,
  getImagesByCategory,
  getAllImages,
} from "../../src/services/imageService.js";
import { query, testConnection, closePool } from "../../src/config/database.js";
import bcrypt from "bcrypt";

// Feature: makeup-artist-website, Property 14: Image deletion completeness
// Validates: Requirements 9.2, 9.5

describe("Property 14: Image deletion completeness", () => {
  let testUserId;
  let testCategoryId;
  let testCategorySlug;
  const testUploadDir = "./uploads/test-property-14";

  beforeAll(async () => {
    // Ensure we're using test database
    process.env.NODE_ENV = "test";
    process.env.UPLOAD_DIR = testUploadDir;
    await testConnection();

    // Create test user
    const testUsername = `test_delete_user_${Date.now()}`;
    const passwordHash = await bcrypt.hash("testpass", 10);
    const userResult = await query(
      "INSERT INTO users (username, password_hash, email) VALUES ($1, $2, $3) RETURNING id",
      [testUsername, passwordHash, "test@delete.com"]
    );
    testUserId = userResult.rows[0].id;

    // Create test category
    testCategorySlug = `test-delete-cat-${Date.now()}`;
    const categoryResult = await query(
      "INSERT INTO categories (name_cs, slug, display_order) VALUES ($1, $2, $3) RETURNING id",
      ["Test Delete Category", testCategorySlug, 999]
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
    // Cleanup any remaining images
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

  test("For any image deleted through the admin panel, that image should be removed from the database and no longer appear in any portfolio gallery", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          originalname: fc
            .string({ minLength: 5, maxLength: 30 })
            .map((s) => s.replace(/[^a-zA-Z0-9._-]/g, "_") + ".jpg"),
          size: fc.integer({ min: 1000, max: 5000000 }),
          mimetype: fc.constantFrom(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
          ),
          content: fc.uint8Array({ minLength: 100, maxLength: 1000 }),
        }),
        async (fileData) => {
          // Step 1: Create an image (upload and store in database)
          const mockFile = {
            originalname: fileData.originalname,
            size: fileData.size,
            mimetype: fileData.mimetype,
            buffer: Buffer.from(fileData.content),
          };

          const savedFile = await saveImageFile(mockFile, testCategorySlug);
          const imageRecord = await createImageRecord({
            categoryId: testCategoryId,
            filename: savedFile.filename,
            originalFilename: savedFile.originalFilename,
            filepath: savedFile.filepath,
            fileSize: savedFile.fileSize,
            mimeType: savedFile.mimeType,
            uploadedBy: testUserId,
          });

          const imageId = imageRecord.id;
          const filepath = savedFile.filepath;

          // Verify image exists in database before deletion
          const beforeDeletion = await query(
            "SELECT * FROM images WHERE id = $1",
            [imageId]
          );
          expect(beforeDeletion.rows.length).toBe(1);

          // Verify file exists on disk before deletion
          const fileExistsBefore = await fs
            .access(filepath)
            .then(() => true)
            .catch(() => false);
          expect(fileExistsBefore).toBe(true);

          // Verify image appears in category gallery before deletion
          const categoryImagesBefore = await getImagesByCategory(
            testCategoryId
          );
          const imageInCategoryBefore = categoryImagesBefore.find(
            (img) => img.id === imageId
          );
          expect(imageInCategoryBefore).toBeDefined();

          // Verify image appears in all images before deletion
          const allImagesBefore = await getAllImages();
          const imageInAllBefore = allImagesBefore.find(
            (img) => img.id === imageId
          );
          expect(imageInAllBefore).toBeDefined();

          // Step 2: Delete the image
          await deleteImage(imageId, testUserId);

          // Step 3: Verify image is removed from database
          const afterDeletion = await query(
            "SELECT * FROM images WHERE id = $1",
            [imageId]
          );
          expect(afterDeletion.rows.length).toBe(0);

          // Step 4: Verify file is removed from disk
          const fileExistsAfter = await fs
            .access(filepath)
            .then(() => true)
            .catch(() => false);
          expect(fileExistsAfter).toBe(false);

          // Step 5: Verify image no longer appears in category gallery
          const categoryImagesAfter = await getImagesByCategory(testCategoryId);
          const imageInCategoryAfter = categoryImagesAfter.find(
            (img) => img.id === imageId
          );
          expect(imageInCategoryAfter).toBeUndefined();

          // Step 6: Verify image no longer appears in all images
          const allImagesAfter = await getAllImages();
          const imageInAllAfter = allImagesAfter.find(
            (img) => img.id === imageId
          );
          expect(imageInAllAfter).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});
