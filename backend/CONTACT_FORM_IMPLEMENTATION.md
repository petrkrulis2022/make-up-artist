# Contact Form Implementation Summary

## Overview

Task 6 has been successfully implemented, adding contact form functionality to the Glow by Hanka backend API. This includes email service integration, API endpoint creation, and comprehensive property-based testing.

## Implemented Components

### 1. Email Service Module (`src/services/emailService.js`)

**Features:**

- Configured nodemailer with SMTP settings from environment variables
- `sendContactEmail(name, email, message)` - Sends formatted contact form emails
- `verifyEmailConnection()` - Utility function to verify SMTP configuration
- Comprehensive error handling for email sending failures
- Email formatting in both plain text and HTML
- Reply-to header set to sender's email for easy responses

**Configuration Required:**
The following environment variables must be set in `.env`:

```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=info@glowbyhanka.cz
SMTP_PASSWORD=your-email-password
SMTP_FROM=info@glowbyhanka.cz
```

### 2. Contact Form API Endpoint (`src/routes/contact.js`)

**Endpoint:** `POST /api/contact`

**Request Body:**

```json
{
  "name": "string (required, non-empty)",
  "email": "string (required, valid email format)",
  "message": "string (required, non-empty)"
}
```

**Validation Rules:**

- All fields are required
- Name must not be empty or whitespace-only
- Email must match valid email format regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Message must not be empty or whitespace-only
- All values are trimmed before processing

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Zpráva byla úspěšně odeslána"
  }
}
```

**Error Responses:**

Missing fields (400):

```json
{
  "success": false,
  "error": {
    "code": "MISSING_FIELDS",
    "message": "Všechna pole jsou povinná"
  }
}
```

Invalid email (400):

```json
{
  "success": false,
  "error": {
    "code": "INVALID_EMAIL",
    "message": "Neplatný formát emailu"
  }
}
```

Invalid name (400):

```json
{
  "success": false,
  "error": {
    "code": "INVALID_NAME",
    "message": "Jméno nesmí být prázdné"
  }
}
```

Invalid message (400):

```json
{
  "success": false,
  "error": {
    "code": "INVALID_MESSAGE",
    "message": "Zpráva nesmí být prázdná"
  }
}
```

Email send failure (500):

```json
{
  "success": false,
  "error": {
    "code": "EMAIL_SEND_FAILED",
    "message": "Nepodařilo se odeslat zprávu. Zkuste to prosím později."
  }
}
```

### 3. Property-Based Tests

#### Test 1: Contact Form Email Delivery (`tests/properties/contactFormEmailDelivery.property.test.js`)

**Property 6: Contact form email delivery**
**Validates: Requirements 6.4**

Tests that verify:

- For any valid contact form submission, the system sends an email with the submitted data
- Email service is invoked exactly once per valid submission
- Whitespace padding is trimmed before sending
- Email sending failures return appropriate error messages in Czech

**Test Configuration:**

- 100 iterations per property test
- Uses mocked email service to avoid sending actual emails
- Generates random valid form data using fast-check

#### Test 2: Contact Form Validation (`tests/properties/contactFormValidation.property.test.js`)

**Property 5: Contact form validation**
**Validates: Requirements 6.5**

Tests that verify:

- Missing required fields trigger validation errors in Czech
- Invalid email formats are rejected with Czech error messages
- Empty or whitespace-only names are rejected
- Empty or whitespace-only messages are rejected
- Email service is never called for invalid submissions
- Valid submissions pass validation and allow email sending

**Test Configuration:**

- 100 iterations per property test
- Comprehensive coverage of all validation scenarios
- Uses fast-check generators for various invalid input patterns

## Integration

The contact route has been integrated into the main server (`src/server.js`):

```javascript
import contactRoutes from "./routes/contact.js";
app.use("/api/contact", contactRoutes);
```

## Testing

### Manual Testing

A manual test script is provided at `test-contact-form.js`:

```bash
node test-contact-form.js
```

This script tests:

1. Valid form submission (requires SMTP configuration)
2. Missing fields validation
3. Invalid email format validation
4. Empty name validation
5. Empty message validation

### Automated Testing

Run property-based tests:

```bash
npm test -- tests/properties/contactFormEmailDelivery.property.test.js
npm test -- tests/properties/contactFormValidation.property.test.js
```

Or run all tests:

```bash
npm test
```

## Requirements Validation

✅ **Requirement 6.4**: Contact form emails are sent with sender name, email, and message
✅ **Requirement 6.5**: Invalid form submissions display validation errors in Czech language

## Notes

- The email service uses nodemailer which is already installed as a dependency
- SMTP configuration must be set up in production for emails to actually send
- During development/testing, you can use services like Mailtrap or Ethereal Email for testing
- All error messages are in Czech as per requirements
- The implementation follows the same patterns as existing routes (auth, portfolio, admin)

## Next Steps

To use this in production:

1. Configure SMTP settings in production `.env` file
2. Test email delivery with real SMTP server
3. Consider adding rate limiting to prevent spam
4. Consider adding CAPTCHA for additional security (future enhancement)
