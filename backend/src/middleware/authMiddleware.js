import { verifyToken } from "../services/authService.js";

/**
 * Middleware to verify JWT tokens from Authorization header
 * Extracts user information from valid tokens and attaches to req.user
 * Handles expired or invalid tokens with appropriate error responses
 */
export const authenticateToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Format: "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: "NO_TOKEN",
          message: "Přístupový token nebyl poskytnut",
        },
      });
    }

    // Verify token
    try {
      const decoded = verifyToken(token);

      // Attach user information to request object
      req.user = {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
      };

      next();
    } catch (error) {
      // Handle specific token errors
      if (error.message === "Token has expired") {
        return res.status(401).json({
          success: false,
          error: {
            code: "TOKEN_EXPIRED",
            message: "Platnost přístupového tokenu vypršela",
          },
        });
      } else if (error.message === "Invalid token") {
        return res.status(401).json({
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "Neplatný přístupový token",
          },
        });
      } else {
        return res.status(401).json({
          success: false,
          error: {
            code: "AUTH_ERROR",
            message: "Chyba při ověřování tokenu",
          },
        });
      }
    }
  } catch (error) {
    console.error("Authentication middleware error:", error.message);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Interní chyba serveru",
      },
    });
  }
};
