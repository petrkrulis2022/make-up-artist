import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { query } from "../config/database.js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

/**
 * Save uploaded image file to disk with unique filename
 * @param {Object} file - Multer file object
 * @param {string} categorySlug - Category slug for organizing files
 * @returns {Promise<Object>} File information (filename, filepath)
 */
export const saveImageFile = async (file, categorySlug) => {
  try {
    // Create category directory if it doesn't exist
    const categoryDir = path.join(UPLOAD_DIR, categorySlug);
    await fs.mkdir(categoryDir, { recursive: true });

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${file.originalname}`;
    const filepath = path.join(categoryDir, uniqueFilename);

    // Write file to disk
    await fs.writeFile(filepath, file.buffer);

    return {
      filename: uniqueFilename,
      filepath: filepath,
      originalFilename: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    };
  } catch (error) {
    console.error("Error saving image file:", error.message);
    throw new Error("Failed to save image file");
  }
};

/**
 * Create image database record with metadata
 * @param {Object} imageData - Image metadata
 * @param {number} imageData.categoryId - Category ID
 * @param {string} imageData.filename - Unique filename
 * @param {string} imageData.originalFilename - Original filename
 * @param {string} imageData.filepath - File path on disk
 * @param {number} imageData.fileSize - File size in bytes
 * @param {string} imageData.mimeType - MIME type
 * @param {number} imageData.uploadedBy - User ID who uploaded
 * @returns {Promise<Object>} Created image record
 */
export const createImageRecord = async (imageData) => {
  try {
    const {
      categoryId,
      filename,
      originalFilename,
      filepath,
      fileSize,
      mimeType,
      uploadedBy,
    } = imageData;

    const result = await query(
      `INSERT INTO images 
        (category_id, filename, original_filename, file_path, file_size, mime_type, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        categoryId,
        filename,
        originalFilename,
        filepath,
        fileSize,
        mimeType,
        uploadedBy,
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error("Error creating image record:", error.message);
    throw new Error("Failed to create image record");
  }
};

/**
 * Retrieve images by category from database
 * @param {number} categoryId - Category ID
 * @returns {Promise<Array>} Array of image records
 */
export const getImagesByCategory = async (categoryId) => {
  try {
    const result = await query(
      `SELECT * FROM images 
       WHERE category_id = $1 
       ORDER BY display_order ASC, uploaded_at DESC`,
      [categoryId]
    );

    return result.rows;
  } catch (error) {
    console.error("Error retrieving images by category:", error.message);
    throw new Error("Failed to retrieve images");
  }
};

/**
 * Retrieve all images from database
 * @returns {Promise<Array>} Array of all image records
 */
export const getAllImages = async () => {
  try {
    const result = await query(
      `SELECT i.*, c.name_cs as category_name, c.slug as category_slug
       FROM images i
       JOIN categories c ON i.category_id = c.id
       ORDER BY c.display_order ASC, i.display_order ASC, i.uploaded_at DESC`
    );

    return result.rows;
  } catch (error) {
    console.error("Error retrieving all images:", error.message);
    throw new Error("Failed to retrieve images");
  }
};

/**
 * Delete image file from disk and database record
 * @param {number} imageId - Image ID
 * @param {number} userId - User ID performing the deletion
 * @returns {Promise<void>}
 */
export const deleteImage = async (imageId, userId) => {
  try {
    // First, get the image record to find the file path
    const imageResult = await query(`SELECT * FROM images WHERE id = $1`, [
      imageId,
    ]);

    if (imageResult.rows.length === 0) {
      throw new Error("Image not found");
    }

    const image = imageResult.rows[0];

    // Delete the file from disk
    try {
      await fs.unlink(image.file_path);
    } catch (fileError) {
      // Log error but continue with database deletion
      console.error("Error deleting file from disk:", fileError.message);
    }

    // Delete the database record
    await query(`DELETE FROM images WHERE id = $1`, [imageId]);

    console.log(`Image ${imageId} deleted successfully by user ${userId}`);
  } catch (error) {
    console.error("Error deleting image:", error.message);
    throw new Error("Failed to delete image");
  }
};
