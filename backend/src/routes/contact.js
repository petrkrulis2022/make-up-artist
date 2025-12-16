import express from "express";
import { sendContactEmail } from "../services/emailService.js";

const router = express.Router();

/**
 * Email validation regex
 * Basic email format validation
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/contact
 * Send contact form message via email
 */
router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_FIELDS",
          message: "Všechna pole jsou povinná",
        },
      });
    }

    // Validate name is not empty or just whitespace
    if (name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_NAME",
          message: "Jméno nesmí být prázdné",
        },
      });
    }

    // Validate email format
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_EMAIL",
          message: "Neplatný formát emailu",
        },
      });
    }

    // Validate message is not empty or just whitespace
    if (message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_MESSAGE",
          message: "Zpráva nesmí být prázdná",
        },
      });
    }

    // Send email
    await sendContactEmail(name.trim(), email.trim(), message.trim());

    // Return success response
    return res.status(200).json({
      success: true,
      data: {
        message: "Zpráva byla úspěšně odeslána",
      },
    });
  } catch (error) {
    console.error("Contact form error:", error.message);
    return res.status(500).json({
      success: false,
      error: {
        code: "EMAIL_SEND_FAILED",
        message: "Nepodařilo se odeslat zprávu. Zkuste to prosím později.",
      },
    });
  }
});

export default router;
