import fc from "fast-check";
import fs from "fs/promises";
import path from "path";
import {
  saveImageFile,
  createImageRecord,
  getImagesByCategory,
} from "../../src/services/imageService.js";
import { query, testConnection, closePool } from "../../src/config/database.js";
import bcrypt from "bcrypt";

// Feature: makeup-artist-website, Property 10: Image upload and categorization
// Validates: Requirements 8.2

describe("Property 10: Image upload and categorization", () => {
  let testUserId;
  let testCategoryId;
  let testCategorySlug;
  const testUploadDir = "./uploads/test-property-10";

  beforeAll(async () => {
    // Ensure we're using test database
    process.env.NODE_ENV = "test";
    process.env.UPLOAD_DIR = testUploadDir;
    await testConnection();

    // Create test user
    const testUsername = `test_upload_user_${Date.now()}`;
    const passwordHash = await bcrypt.hash("testpass", 10);
    const userResult = await query(
      "INSERT INTO users (username, password_hash, email) VALUES ($1, $2, $3) RETURNING id",
      [testUsername, passwordHash, "test@upload.com"]
    );
    testUserId = userResult.rows[0].id;

    // Create test category
    testCategorySlug = `test-upload-cat-${Date.now()}`;
    const categoryResult = await query(
      "INSERT INTO categories (name_cs, slug, display_order) VALUES ($1, $2, $3) RETURNING id",
      ["Test Upload Category", testCategorySlug, 999]
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

  test("For any valid image file uploaded with a category selection, the system should store the image file and create a database record associating it with the selected category", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          originalname: fc
            .string({ minLength: 5, maxLength: 30 })
            .map((s) => s.replace(/[^a-zA-Z0-9._-]/g, "_") + ".jpg"),
          size: fc.integer({ min: 1000, max: 5000000 }), // 1KB to 5MB
          mimetype: fc.constantFrom(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
          ),
          content: fc.uint8Array({ minLength: 100, maxLength: 1000 }),
        }),
        async (fileData) => {
          // Create mock file object similar to Multer's file object
          const mockFile = {
            originalname: fileData.originalname,
            size: fileData.size,
            mimetype: fileData.mimetype,
            buffer: Buffer.from(fileData.content),
          };

          // Step 1: Save image file to disk
          const savedFile = await saveImageFile(mockFile, testCategorySlug);

          // Verify file was saved with correct properties
          expect(savedFile.filename).toBeDefined();
          expect(savedFile.filepath).toBeDefined();
          expect(savedFile.originalFilename).toBe(fileData.originalname);
          expect(savedFile.fileSize).toBe(fileData.size);
          expect(savedFile.mimeType).toBe(fileData.mimetype);

          // Verify file exists on disk
          const fileExists = await fs
            .access(savedFile.filepath)
            .then(() => true)
            .catch(() => false);
          expect(fileExists).toBe(true);

          // Step 2: Create database record
          const imageRecord = await createImageRecord({
            categoryId: testCategoryId,
            filename: savedFile.filename,
            originalFilename: savedFile.originalFilename,
            filepath: savedFile.filepath,
            fileSize: savedFile.fileSize,
            mimeType: savedFile.mimeType,
            uploadedBy: testUserId,
          });

          // Verify database record was created
          expect(imageRecord.id).toBeDefined();
          expect(imageRecord.category_id).toBe(testCategoryId);
          expect(imageRecord.filename).toBe(savedFile.filename);
          expect(imageRecord.original_filename).toBe(fileData.originalname);
          expect(imageRecord.file_size).toBe(fileData.size);
          expect(imageRecord.mime_type).toBe(fileData.mimetype);
          expect(imageRecord.uploaded_by).toBe(testUserId);

          // Step 3: Verify image is associated with the correct category
          const categoryImages = await getImagesByCategory(testCategoryId);

          // The uploaded image should be in the category's images
          const uploadedImage = categoryImages.find(
            (img) => img.id === imageRecord.id
          );
          expect(uploadedImage).toBeDefined();
          expect(uploadedImage.category_id).toBe(testCategoryId);
          expect(uploadedImage.filename).toBe(savedFile.filename);
        }
      ),
      { numRuns: 100 }
    );
  });
});
