import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "24h";
const BCRYPT_ROUNDS = 10;

/**
 * Hash a password using bcrypt with minimum 10 rounds
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export const hashPassword = async (password) => {
  try {
    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    return hash;
  } catch (error) {
    console.error("Error hashing password:", error.message);
    throw new Error("Failed to hash password");
  }
};

/**
 * Compare a plain text password with a hashed password
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if passwords match, false otherwise
 */
export const comparePassword = async (password, hash) => {
  try {
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  } catch (error) {
    console.error("Error comparing password:", error.message);
    throw new Error("Failed to compare password");
  }
};

/**
 * Generate a JWT token with 24-hour expiration
 * @param {Object} payload - Data to encode in the token (e.g., user id, username)
 * @returns {string} JWT token
 */
export const generateToken = (payload) => {
  try {
    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRATION,
    });
    return token;
  } catch (error) {
    console.error("Error generating token:", error.message);
    throw new Error("Failed to generate token");
  }
};

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyToken = (token) => {
  try {
    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Token has expired");
    } else if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid token");
    } else {
      console.error("Error verifying token:", error.message);
      throw new Error("Failed to verify token");
    }
  }
};
