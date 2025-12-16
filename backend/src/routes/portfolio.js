import express from "express";
import { query } from "../config/database.js";
import { getImagesByCategory } from "../services/imageService.js";

const router = express.Router();

/**
 * GET /api/portfolio/categories
 * Return all categories
 */
router.get("/categories", async (req, res) => {
  try {
    const result = await query(
      "SELECT id, name_cs, slug, display_order FROM categories ORDER BY display_order ASC"
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching categories:", error.message);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Chyba při načítání kategorií",
      },
    });
  }
});

/**
 * GET /api/portfolio/images/:categoryId
 * Return images for specific category
 */
router.get("/images/:categoryId", async (req, res) => {
  try {
    const { categoryId } = req.params;

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

    // Check if category exists
    const categoryResult = await query(
      "SELECT id FROM categories WHERE id = $1",
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

    // Get images for the category
    const images = await getImagesByCategory(categoryIdNum);

    return res.status(200).json({
      success: true,
      data: images,
    });
  } catch (error) {
    console.error("Error fetching images by category:", error.message);
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
