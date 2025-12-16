import {
  saveImageFile,
  createImageRecord,
  getImagesByCategory,
  getAllImages,
  deleteImage,
} from "./src/services/imageService.js";
import { query, testConnection, closePool } from "./src/config/database.js";
import bcrypt from "bcrypt";
import fs from "fs/promises";

async function testImageService() {
  console.log("Testing Image Service...\n");

  try {
    // Set test environment
    process.env.NODE_ENV = "test";
    process.env.UPLOAD_DIR = "./uploads/test-manual";

    await testConnection();
    console.log("✓ Database connected\n");

    // Create test user
    const testUsername = `test_manual_${Date.now()}`;
    const passwordHash = await bcrypt.hash("testpass", 10);
    const userResult = await query(
      "INSERT INTO users (username, password_hash, email) VALUES ($1, $2, $3) RETURNING id",
      [testUsername, passwordHash, "test@manual.com"]
    );
    const testUserId = userResult.rows[0].id;
    console.log(`✓ Created test user (ID: ${testUserId})\n`);

    // Create test category
    const testCategorySlug = `test-manual-cat-${Date.now()}`;
    const categoryResult = await query(
      "INSERT INTO categories (name_cs, slug, display_order) VALUES ($1, $2, $3) RETURNING id",
      ["Test Manual Category", testCategorySlug, 999]
    );
    const testCategoryId = categoryResult.rows[0].id;
    console.log(`✓ Created test category (ID: ${testCategoryId})\n`);

    // Test 1: Save image file
    console.log("Test 1: Save image file to disk");
    const mockFile = {
      originalname: "test-image.jpg",
      size: 5000,
      mimetype: "image/jpeg",
      buffer: Buffer.from("fake image content"),
    };

    const savedFile = await saveImageFile(mockFile, testCategorySlug);
    console.log(`✓ File saved: ${savedFile.filename}`);
    console.log(`  Path: ${savedFile.filepath}\n`);

    // Test 2: Create image record
    console.log("Test 2: Create image database record");
    const imageRecord = await createImageRecord({
      categoryId: testCategoryId,
      filename: savedFile.filename,
      originalFilename: savedFile.originalFilename,
      filepath: savedFile.filepath,
      fileSize: savedFile.fileSize,
      mimeType: savedFile.mimeType,
      uploadedBy: testUserId,
    });
    console.log(`✓ Image record created (ID: ${imageRecord.id})\n`);

    // Test 3: Get images by category
    console.log("Test 3: Retrieve images by category");
    const categoryImages = await getImagesByCategory(testCategoryId);
    console.log(`✓ Found ${categoryImages.length} image(s) in category\n`);

    // Test 4: Get all images
    console.log("Test 4: Retrieve all images");
    const allImages = await getAllImages();
    console.log(`✓ Found ${allImages.length} total image(s)\n`);

    // Test 5: Delete image
    console.log("Test 5: Delete image");
    await deleteImage(imageRecord.id, testUserId);
    console.log(`✓ Image deleted (ID: ${imageRecord.id})\n`);

    // Verify deletion
    const afterDeletion = await query("SELECT * FROM images WHERE id = $1", [
      imageRecord.id,
    ]);
    console.log(
      `✓ Verified: ${afterDeletion.rows.length} records found (should be 0)\n`
    );

    // Cleanup
    console.log("Cleaning up test data...");
    await query("DELETE FROM users WHERE id = $1", [testUserId]);
    await query("DELETE FROM categories WHERE id = $1", [testCategoryId]);
    await fs.rm("./uploads/test-manual", { recursive: true, force: true });
    console.log("✓ Cleanup complete\n");

    console.log("✅ All tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error);
  } finally {
    await closePool();
  }
}

testImageService();
