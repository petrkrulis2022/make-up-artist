/**
 * Manual test script for contact form functionality
 * This script tests the contact form endpoint without sending actual emails
 */

import request from "supertest";
import app from "./src/server.js";

console.log("Testing Contact Form API Endpoint\n");
console.log("=".repeat(50));

// Test 1: Valid submission
console.log("\n1. Testing valid form submission...");
request(app)
  .post("/api/contact")
  .send({
    name: "Test User",
    email: "test@example.com",
    message: "This is a test message",
  })
  .then((response) => {
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(response.body, null, 2));
    console.log(
      response.status === 200 && response.body.success
        ? "✓ PASS"
        : "✗ FAIL (Note: May fail if SMTP is not configured)"
    );

    // Test 2: Missing fields
    console.log("\n2. Testing missing fields...");
    return request(app).post("/api/contact").send({
      name: "Test User",
      email: "test@example.com",
      // Missing message
    });
  })
  .then((response) => {
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(response.body, null, 2));
    console.log(
      response.status === 400 &&
        !response.body.success &&
        response.body.error.code === "MISSING_FIELDS"
        ? "✓ PASS"
        : "✗ FAIL"
    );

    // Test 3: Invalid email format
    console.log("\n3. Testing invalid email format...");
    return request(app).post("/api/contact").send({
      name: "Test User",
      email: "invalid-email",
      message: "Test message",
    });
  })
  .then((response) => {
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(response.body, null, 2));
    console.log(
      response.status === 400 &&
        !response.body.success &&
        response.body.error.code === "INVALID_EMAIL"
        ? "✓ PASS"
        : "✗ FAIL"
    );

    // Test 4: Empty name (whitespace only)
    console.log("\n4. Testing empty name (whitespace only)...");
    return request(app).post("/api/contact").send({
      name: "   ",
      email: "test@example.com",
      message: "Test message",
    });
  })
  .then((response) => {
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(response.body, null, 2));
    console.log(
      response.status === 400 && !response.body.success ? "✓ PASS" : "✗ FAIL"
    );

    // Test 5: Empty message (whitespace only)
    console.log("\n5. Testing empty message (whitespace only)...");
    return request(app).post("/api/contact").send({
      name: "Test User",
      email: "test@example.com",
      message: "   ",
    });
  })
  .then((response) => {
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(response.body, null, 2));
    console.log(
      response.status === 400 && !response.body.success ? "✓ PASS" : "✗ FAIL"
    );

    console.log("\n" + "=".repeat(50));
    console.log("Testing complete!");
    console.log(
      "\nNote: Test 1 may fail if SMTP is not configured in .env file."
    );
    console.log(
      "All other tests should pass as they test validation logic only."
    );
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Error during testing:", error.message);
    process.exit(1);
  });
