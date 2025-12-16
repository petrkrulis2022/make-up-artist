import express from "express";
import { query } from "../config/database.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import {
  uploadSingleImage,
  handleUploadError,
} from "../middleware/uploadMiddleware.js";
import {
  saveImageFile,
  createImageRecord,
  getAllImages,
  deleteImage,
} from "../services/imageService.js";

const router = express.Router();

/**
 * GET /api/admin/verify
 * Verify JWT token validity
 */
router.get("/verify", authenticateToken, async (req, res) => {
  try {
    // If we reach here, the token is valid (authenticateToken middleware passed)
    return res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    console.error("Error verifying token:", error.message);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Chyba při ověřování tokenu",
      },
    });
  }
});

/**
 * POST /api/admin/images
 * Upload a new image with authentication
 */
router.post(
  "/images",
  authenticateToken,
  uploadSingleImage,
  handleUploadError,
  async (req, res) => {
    try {
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: {
            code: "NO_FILE",
            message: "Nebyl nahrán žádný soubor",
          },
        });
      }

      // Get category ID from request body
      const { categoryId } = req.body;

      if (!categoryId) {
        return res.status(400).json({
          success: false,
          error: {
            code: "MISSING_CATEGORY",
            message: "ID kategorie je povinné",
          },
        });
      }

      // Validate categoryId is a number
      const categoryIdNum = parseInt(categoryId, 10);
      if (isNaN(categoryIdNum)) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_CATEGORY_ID",
            message: "Neplatné ID kategorie",
          },
        });
      }

      // Check if category exists and get slug
      const categoryResult = await query(
        "SELECT id, slug FROM categories WHERE id = $1",
        [categoryIdNum]
      );

      if (categoryResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: "CATEGORY_NOT_FOUND",
            message: "Kategorie nebyla nalezena",
          },
        });
      }

      const category = categoryResult.rows[0];

      // Save file to disk
      const fileInfo = await saveImageFile(req.file, category.slug);

      // Create database record
      const imageRecord = await createImageRecord({
        categoryId: categoryIdNum,
        filename: fileInfo.filename,
        originalFilename: fileInfo.originalFilename,
        filepath: fileInfo.filepath,
        fileSize: fileInfo.fileSize,
        mimeType: fileInfo.mimeType,
        uploadedBy: req.user.id,
      });

      return res.status(201).json({
        success: true,
        message: "Obrázek byl úspěšně nahrán",
        data: imageRecord,
      });
    } catch (error) {
      console.error("Error uploading image:", error.message);
      return res.status(500).json({
        success: false,
        error: {
          code: "UPLOAD_FAILED",
          message: "Nahrávání obrázku selhalo",
        },
      });
    }
  }
);

/**
 * DELETE /api/admin/images/:imageId
 * Delete an image with authentication
 */
router.delete("/images/:imageId", authenticateToken, async (req, res) => {
  try {
    const { imageId } = req.params;

    // Validate imageId is a number
    const imageIdNum = parseInt(imageId, 10);
    if (isNaN(imageIdNum)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_IMAGE_ID",
          message: "Neplatné ID obrázku",
        },
      });
    }

    // Check if image exists
    const imageResult = await query("SELECT id FROM images WHERE id = $1", [
      imageIdNum,
    ]);

    if (imageResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "IMAGE_NOT_FOUND",
          message: "Obrázek nebyl nalezen",
        },
      });
    }

    // Delete the image
    await deleteImage(imageIdNum, req.user.id);

    return res.status(200).json({
      success: true,
      message: "Obrázek byl úspěšně smazán",
    });
  } catch (error) {
    console.error("Error deleting image:", error.message);
    return res.status(500).json({
      success: false,
      error: {
        code: "DELETE_FAILED",
        message: "Mazání obrázku selhalo",
      },
    });
  }
});

/**
 * GET /api/admin/images
 * Retrieve all images with authentication
 */
router.get("/images", authenticateToken, async (req, res) => {
  try {
    const images = await getAllImages();

    return res.status(200).json({
      success: true,
      data: images,
    });
  } catch (error) {
    console.error("Error fetching all images:", error.message);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Chyba při načítání obrázků",
      },
    });
  }
});

export default router;
