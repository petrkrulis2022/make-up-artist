import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import portfolioRoutes from "./routes/portfolio.js";
import adminRoutes from "./routes/admin.js";
import contactRoutes from "./routes/contact.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import {
  apiRateLimiter,
  requestSizeLimits,
} from "./middleware/securityMiddleware.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
// Helmet for security headers
app.use(helmet());

// CORS configuration to allow frontend origin
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Request size limits
app.use(express.json(requestSizeLimits.json));
app.use(express.urlencoded(requestSizeLimits.urlencoded));

// General API rate limiting
app.use("/api/", apiRateLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);

// Basic health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Centralized error handler - must be last
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
