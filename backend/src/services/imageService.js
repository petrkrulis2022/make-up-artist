import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { supabase } from "../config/database.js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR_CONFIG = process.env.UPLOAD_DIR || "./uploads";
// Resolve upload directory relative to the backend root (parent of src)
const UPLOAD_DIR = path.resolve(
  __dirname,
  "..",
  UPLOAD_DIR_CONFIG.replace("./", "")
);

/**
 * Save uploaded image file to disk with unique filename
 */
export const saveImageFile = async (file, categorySlug) => {
  try {
    const categoryDir = path.join(UPLOAD_DIR, categorySlug);
    await fs.mkdir(categoryDir, { recursive: true });

    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${file.originalname}`;
    const filepath = path.join(categoryDir, uniqueFilename);

    await fs.writeFile(filepath, file.buffer);

    // Store URL-friendly path (for serving via /uploads route)
    const urlPath = `/uploads/${categorySlug}/${uniqueFilename}`;

    return {
      filename: uniqueFilename,
      filepath: urlPath,
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
 * Create image database record
 */
export const createImageRecord = async (imageData) => {
  try {
    const { data, error } = await supabase
      .from("images")
      .insert({
        category_id: imageData.categoryId,
        filename: imageData.filename,
        original_filename: imageData.originalFilename,
        file_path: imageData.filepath,
        file_size: imageData.fileSize,
        mime_type: imageData.mimeType,
        uploaded_by: imageData.uploadedBy,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating image record:", error.message);
    throw new Error("Failed to create image record");
  }
};

/**
 * Retrieve images by category
 */
export const getImagesByCategory = async (categoryId) => {
  try {
    const { data, error } = await supabase
      .from("images")
      .select("*")
      .eq("category_id", categoryId)
      .order("display_order", { ascending: true })
      .order("uploaded_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error retrieving images by category:", error.message);
    throw new Error("Failed to retrieve images");
  }
};

/**
 * Retrieve all images with category info
 */
export const getAllImages = async () => {
  try {
    const { data, error } = await supabase
      .from("images")
      .select(
        `
        *,
        categories (
          name_cs,
          slug
        )
      `
      )
      .order("uploaded_at", { ascending: false });

    if (error) throw error;

    // Transform data to match expected format
    return (data || []).map((img) => ({
      ...img,
      category_name: img.categories?.name_cs,
      category_slug: img.categories?.slug,
    }));
  } catch (error) {
    console.error("Error retrieving all images:", error.message);
    throw new Error("Failed to retrieve images");
  }
};

/**
 * Delete image file and database record
 */
export const deleteImage = async (imageId, userId) => {
  try {
    // Get image record first
    const { data: image, error: fetchError } = await supabase
      .from("images")
      .select("*")
      .eq("id", imageId)
      .single();

    if (fetchError || !image) {
      throw new Error("Image not found");
    }

    // Delete file from disk - convert URL path back to file system path
    try {
      // file_path is like /uploads/category/filename.jpg
      // We need to convert to absolute path: UPLOAD_DIR/category/filename.jpg
      const relativePath = image.file_path.replace(/^\/uploads\//, "");
      const filePath = path.join(UPLOAD_DIR, relativePath);
      await fs.unlink(filePath);
    } catch (fileError) {
      console.error("Error deleting file from disk:", fileError.message);
    }

    // Delete database record
    const { error: deleteError } = await supabase
      .from("images")
      .delete()
      .eq("id", imageId);

    if (deleteError) throw deleteError;

    console.log(`Image ${imageId} deleted successfully by user ${userId}`);
  } catch (error) {
    console.error("Error deleting image:", error.message);
    throw new Error("Failed to delete image");
  }
};
