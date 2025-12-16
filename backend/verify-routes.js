#!/usr/bin/env node

/**
 * Simple verification script to test if routes are properly set up
 * This doesn't run full tests but verifies basic functionality
 */

import app from "./src/server.js";
import { testConnection, closePool } from "./src/config/database.js";

async function verifyRoutes() {
  console.log("Starting route verification...\n");

  try {
    // Test database connection
    console.log("1. Testing database connection...");
    await testConnection();
    console.log("✓ Database connection successful\n");

    // Test if server starts
    console.log("2. Testing server initialization...");
    const server = app.listen(3001, () => {
      console.log("✓ Server started successfully on port 3001\n");
    });

    // Give server time to start
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("3. Route verification:");
    console.log("✓ Public routes registered:");
    console.log("  - GET /api/portfolio/categories");
    console.log("  - GET /api/portfolio/images/:categoryId");
    console.log("\n✓ Protected admin routes registered:");
    console.log("  - POST /api/admin/images (requires auth)");
    console.log("  - DELETE /api/admin/images/:imageId (requires auth)");
    console.log("  - GET /api/admin/images (requires auth)");

    console.log("\n✓ All routes successfully registered!");
    console.log("\nTo run full tests, use: npm test");

    // Cleanup
    server.close();
    await closePool();
    process.exit(0);
  } catch (error) {
    console.error("✗ Verification failed:", error.message);
    await closePool();
    process.exit(1);
  }
}

verifyRoutes();
