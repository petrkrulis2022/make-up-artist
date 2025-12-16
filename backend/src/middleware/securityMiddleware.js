import rateLimit from "express-rate-limit";

/**
 * Rate limiter for login endpoint
 * Prevents brute force attacks by limiting login attempts
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Příliš mnoho pokusů o přihlášení. Zkuste to prosím později.",
    },
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count successful requests
  skipFailedRequests: false, // Count failed requests
});

/**
 * General API rate limiter
 * Prevents API abuse by limiting requests per IP
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Příliš mnoho požadavků. Zkuste to prosím později.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Request size limiter configuration
 * Returns middleware configuration for express.json() and express.urlencoded()
 */
export const requestSizeLimits = {
  json: { limit: "10mb" }, // Limit JSON body size
  urlencoded: { limit: "10mb", extended: true }, // Limit URL-encoded body size
};
