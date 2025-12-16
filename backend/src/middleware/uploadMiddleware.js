import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 5242880; // 5MB default

// Allowed image MIME types
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

// Allowed file extensions
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

/**
 * File filter function to validate file type
 * @param {Object} req - Express request object
 * @param {Object} file - Multer file object
 * @param {Function} cb - Callback function
 */
const fileFilter = (req, file, cb) => {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new Error("Neplatný typ souboru. Povolené formáty: JPG, JPEG, PNG, WEBP"),
      false
    );
  }

  // Check file extension
  const ext = file.originalname
    .toLowerCase()
    .slice(file.originalname.lastIndexOf("."));
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(
      new Error(
        "Neplatná přípona souboru. Povolené přípony: .jpg, .jpeg, .png, .webp"
      ),
      false
    );
  }

  // File is valid
  cb(null, true);
};

/**
 * Configure Multer for image uploads
 * Uses memory storage to allow custom file naming and organization
 */
const upload = multer({
  storage: multer.memoryStorage(), // Store in memory for custom processing
  limits: {
    fileSize: MAX_FILE_SIZE, // 5MB limit
  },
  fileFilter: fileFilter,
});

/**
 * Middleware for single image upload
 */
export const uploadSingleImage = upload.single("image");

/**
 * Middleware for multiple image uploads (up to 10)
 */
export const uploadMultipleImages = upload.array("images", 10);

/**
 * Error handling middleware for Multer errors
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: {
          code: "FILE_TOO_LARGE",
          message: "Soubor je příliš velký. Maximální velikost je 5MB.",
        },
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        error: {
          code: "TOO_MANY_FILES",
          message: "Příliš mnoho souborů. Maximální počet je 10.",
        },
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        error: {
          code: "UNEXPECTED_FIELD",
          message: "Neočekávané pole souboru.",
        },
      });
    }

    // Other Multer errors
    return res.status(400).json({
      success: false,
      error: {
        code: "UPLOAD_ERROR",
        message: "Chyba při nahrávání souboru.",
      },
    });
  } else if (err) {
    // Custom validation errors (from fileFilter)
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_FILE",
        message: err.message,
      },
    });
  }

  next();
};

export default upload;
