import express from "express";
import { query } from "../config/database.js";
import { comparePassword, generateToken } from "../services/authService.js";
import { loginRateLimiter } from "../middleware/securityMiddleware.js";

const router = express.Router();

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 * Rate limited to prevent brute force attacks
 */
router.post("/login", loginRateLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate request body
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_CREDENTIALS",
          message: "Uživatelské jméno a heslo jsou povinné",
        },
      });
    }

    // Query user from database
    const result = await query(
      "SELECT id, username, password_hash, email FROM users WHERE username = $1",
      [username]
    );

    // Check if user exists
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Neplatné přihlašovací údaje",
        },
      });
    }

    const user = result.rows[0];

    // Compare password with hash
    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Neplatné přihlašovací údaje",
        },
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      username: user.username,
      email: user.email,
    });

    // Return success response with token and user info
    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Interní chyba serveru",
      },
    });
  }
});

export default router;
