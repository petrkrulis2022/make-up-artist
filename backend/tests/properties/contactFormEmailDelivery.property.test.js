import fc from "fast-check";
import request from "supertest";
import app from "../../src/server.js";
import * as emailService from "../../src/services/emailService.js";

// Feature: makeup-artist-website, Property 6: Contact form email delivery
// Validates: Requirements 6.4

// Mock the email service to avoid actually sending emails during tests
jest.mock("../../src/services/emailService.js", () => ({
  sendContactEmail: jest.fn(),
}));

describe("Property 6: Contact form email delivery", () => {
  beforeEach(() => {
    // Clear mock calls before each test
    jest.clearAllMocks();
  });

  test("For any valid contact form submission, the system should send an email containing the submitted name, email, and message", async () => {
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
        async (formData) => {
          // Mock successful email sending
          emailService.sendContactEmail.mockResolvedValueOnce({
            messageId: "test-message-id",
          });

          const response = await request(app).post("/api/contact").send({
            name: formData.name,
            email: formData.email,
            message: formData.message,
          });

          // Verify the response is successful
          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
          expect(response.body.data.message).toBe(
            "Zpráva byla úspěšně odeslána"
          );

          // Verify sendContactEmail was called with the correct parameters
          expect(emailService.sendContactEmail).toHaveBeenCalledTimes(1);
          expect(emailService.sendContactEmail).toHaveBeenCalledWith(
            formData.name.trim(),
            formData.email.trim(),
            formData.message.trim()
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  test("For any valid form data, the email service should be invoked exactly once", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc
            .string({ minLength: 1, maxLength: 100 })
            .filter((s) => s.trim().length > 0),
          email: fc.emailAddress(),
          message: fc
            .string({ minLength: 1, maxLength: 1000 })
            .filter((s) => s.trim().length > 0),
        }),
        async (formData) => {
          // Mock successful email sending
          emailService.sendContactEmail.mockResolvedValueOnce({
            messageId: "test-message-id",
          });

          await request(app).post("/api/contact").send(formData);

          // Verify email service was called exactly once
          expect(emailService.sendContactEmail).toHaveBeenCalledTimes(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  test("For any form submission with whitespace padding, the system should trim values before sending email", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim().length > 0),
          email: fc.emailAddress(),
          message: fc
            .string({ minLength: 1, maxLength: 500 })
            .filter((s) => s.trim().length > 0),
          leadingSpaces: fc.integer({ min: 1, max: 5 }),
          trailingSpaces: fc.integer({ min: 1, max: 5 }),
        }),
        async ({ name, email, message, leadingSpaces, trailingSpaces }) => {
          // Add whitespace padding
          const paddedName =
            " ".repeat(leadingSpaces) + name + " ".repeat(trailingSpaces);
          const paddedEmail =
            " ".repeat(leadingSpaces) + email + " ".repeat(trailingSpaces);
          const paddedMessage =
            " ".repeat(leadingSpaces) + message + " ".repeat(trailingSpaces);

          // Mock successful email sending
          emailService.sendContactEmail.mockResolvedValueOnce({
            messageId: "test-message-id",
          });

          await request(app).post("/api/contact").send({
            name: paddedName,
            email: paddedEmail,
            message: paddedMessage,
          });

          // Verify email service was called with trimmed values
          expect(emailService.sendContactEmail).toHaveBeenCalledWith(
            name,
            email,
            message
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  test("For any email sending failure, the system should return an error response in Czech", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc
            .string({ minLength: 1, maxLength: 100 })
            .filter((s) => s.trim().length > 0),
          email: fc.emailAddress(),
          message: fc
            .string({ minLength: 1, maxLength: 1000 })
            .filter((s) => s.trim().length > 0),
        }),
        async (formData) => {
          // Mock email sending failure
          emailService.sendContactEmail.mockRejectedValueOnce(
            new Error("SMTP connection failed")
          );

          const response = await request(app)
            .post("/api/contact")
            .send(formData);

          // Verify error response
          expect(response.status).toBe(500);
          expect(response.body.success).toBe(false);
          expect(response.body.error).toBeDefined();
          expect(response.body.error.code).toBe("EMAIL_SEND_FAILED");
          expect(response.body.error.message).toBe(
            "Nepodařilo se odeslat zprávu. Zkuste to prosím později."
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
