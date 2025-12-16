import fc from "fast-check";
import request from "supertest";
import app from "../../src/server.js";
import * as emailService from "../../src/services/emailService.js";

// Feature: makeup-artist-website, Property 5: Contact form validation
// Validates: Requirements 6.5

// Mock the email service to avoid actually sending emails during tests
jest.mock("../../src/services/emailService.js", () => ({
  sendContactEmail: jest.fn(),
}));

describe("Property 5: Contact form validation", () => {
  beforeEach(() => {
    // Clear mock calls before each test
    jest.clearAllMocks();
  });

  test("For any form submission with missing required fields, the system should display validation error in Czech and prevent submission", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          { email: "test@example.com", message: "Test message" }, // Missing name
          { name: "Test Name", message: "Test message" }, // Missing email
          { name: "Test Name", email: "test@example.com" }, // Missing message
          { name: "Test Name" }, // Missing email and message
          { email: "test@example.com" }, // Missing name and message
          { message: "Test message" }, // Missing name and email
          {} // Missing all fields
        ),
        async (incompleteData) => {
          const response = await request(app)
            .post("/api/contact")
            .send(incompleteData);

          // Verify validation error
          expect(response.status).toBe(400);
          expect(response.body.success).toBe(false);
          expect(response.body.error).toBeDefined();
          expect(response.body.error.code).toBe("MISSING_FIELDS");

          // Verify error message is in Czech
          expect(response.body.error.message).toBe("Všechna pole jsou povinná");

          // Verify email service was not called
          expect(emailService.sendContactEmail).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  test("For any form submission with invalid email format, the system should display validation error in Czech", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc
            .string({ minLength: 1, maxLength: 100 })
            .filter((s) => s.trim().length > 0),
          email: fc
            .string({ minLength: 1, maxLength: 100 })
            .filter(
              (s) =>
                s.trim().length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
            ),
          message: fc
            .string({ minLength: 1, maxLength: 1000 })
            .filter((s) => s.trim().length > 0),
        }),
        async (formData) => {
          const response = await request(app)
            .post("/api/contact")
            .send(formData);

          // Verify validation error
          expect(response.status).toBe(400);
          expect(response.body.success).toBe(false);
          expect(response.body.error).toBeDefined();
          expect(response.body.error.code).toBe("INVALID_EMAIL");

          // Verify error message is in Czech
          expect(response.body.error.message).toBe("Neplatný formát emailu");

          // Verify email service was not called
          expect(emailService.sendContactEmail).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  test("For any form submission with empty or whitespace-only name, the system should display validation error in Czech", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc
            .string({ minLength: 0, maxLength: 50 })
            .filter((s) => s.trim().length === 0),
          email: fc.emailAddress(),
          message: fc
            .string({ minLength: 1, maxLength: 1000 })
            .filter((s) => s.trim().length > 0),
        }),
        async (formData) => {
          const response = await request(app)
            .post("/api/contact")
            .send(formData);

          // Verify validation error
          expect(response.status).toBe(400);
          expect(response.body.success).toBe(false);
          expect(response.body.error).toBeDefined();

          // Should be either MISSING_FIELDS or INVALID_NAME
          expect(["MISSING_FIELDS", "INVALID_NAME"]).toContain(
            response.body.error.code
          );

          // Verify error message is in Czech
          expect(response.body.error.message).toMatch(
            /Všechna pole jsou povinná|Jméno nesmí být prázdné/
          );

          // Verify email service was not called
          expect(emailService.sendContactEmail).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  test("For any form submission with empty or whitespace-only message, the system should display validation error in Czech", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc
            .string({ minLength: 1, maxLength: 100 })
            .filter((s) => s.trim().length > 0),
          email: fc.emailAddress(),
          message: fc
            .string({ minLength: 0, maxLength: 50 })
            .filter((s) => s.trim().length === 0),
        }),
        async (formData) => {
          const response = await request(app)
            .post("/api/contact")
            .send(formData);

          // Verify validation error
          expect(response.status).toBe(400);
          expect(response.body.success).toBe(false);
          expect(response.body.error).toBeDefined();

          // Should be either MISSING_FIELDS or INVALID_MESSAGE
          expect(["MISSING_FIELDS", "INVALID_MESSAGE"]).toContain(
            response.body.error.code
          );

          // Verify error message is in Czech
          expect(response.body.error.message).toMatch(
            /Všechna pole jsou povinná|Zpráva nesmí být prázdná/
          );

          // Verify email service was not called
          expect(emailService.sendContactEmail).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  test("For any invalid form submission, the email service should never be called", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          // Missing fields
          fc.record({
            name: fc.option(fc.string(), { nil: undefined }),
            email: fc.option(fc.emailAddress(), { nil: undefined }),
            message: fc.option(fc.string(), { nil: undefined }),
          }),
          // Invalid email
          fc.record({
            name: fc
              .string({ minLength: 1, maxLength: 100 })
              .filter((s) => s.trim().length > 0),
            email: fc
              .string({ minLength: 1, maxLength: 100 })
              .filter(
                (s) =>
                  s.trim().length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
              ),
            message: fc
              .string({ minLength: 1, maxLength: 1000 })
              .filter((s) => s.trim().length > 0),
          }),
          // Empty name
          fc.record({
            name: fc
              .string({ minLength: 0, maxLength: 50 })
              .filter((s) => s.trim().length === 0),
            email: fc.emailAddress(),
            message: fc
              .string({ minLength: 1, maxLength: 1000 })
              .filter((s) => s.trim().length > 0),
          }),
          // Empty message
          fc.record({
            name: fc
              .string({ minLength: 1, maxLength: 100 })
              .filter((s) => s.trim().length > 0),
            email: fc.emailAddress(),
            message: fc
              .string({ minLength: 0, maxLength: 50 })
              .filter((s) => s.trim().length === 0),
          })
        ),
        async (invalidData) => {
          await request(app).post("/api/contact").send(invalidData);

          // Verify email service was never called for invalid data
          expect(emailService.sendContactEmail).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  test("For any valid form submission, validation should pass and allow email sending", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc
            .string({ minLength: 1, maxLength: 100 })
            .filter((s) => s.trim().length > 0),
          email: fc
            .emailAddress()
            .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)),
          message: fc
            .string({ minLength: 1, maxLength: 1000 })
            .filter((s) => s.trim().length > 0),
        }),
        async (validData) => {
          // Mock successful email sending
          emailService.sendContactEmail.mockResolvedValueOnce({
            messageId: "test-message-id",
          });

          const response = await request(app)
            .post("/api/contact")
            .send(validData);

          // Verify validation passed
          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);

          // Verify email service was called
          expect(emailService.sendContactEmail).toHaveBeenCalledTimes(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
