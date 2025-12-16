# Checkpoint 8: Backend Tests Verification

This checkpoint ensures all backend tests are passing before proceeding to frontend implementation.

## Test Suite Overview

The backend has the following test files:

### Property-Based Tests (9 tests)

Located in `backend/tests/properties/`:

1. **dataPersistence.property.test.js** - Property 18: Data persistence after restart
2. **databaseQueryAccuracy.property.test.js** - Property 19: Database query accuracy
3. **passwordSecurity.property.test.js** - Property 20: Password security
4. **authenticationRejection.property.test.js** - Property 7: Authentication rejection
5. **protectedRouteAccess.property.test.js** - Property 8: Protected route access control
6. **imageUploadCategorization.property.test.js** - Property 10: Image upload and categorization
7. **imageDeletion.property.test.js** - Property 14: Image deletion completeness
8. **contactFormEmailDelivery.property.test.js** - Property 6: Contact form email delivery
9. **contactFormValidation.property.test.js** - Property 5: Contact form validation

### Unit Tests (3 test files)

Located in `backend/src/`:

1. **src/services/authService.test.js** - Authentication service unit tests
2. **src/middleware/errorHandler.test.js** - Error handling middleware tests
3. **src/middleware/securityMiddleware.test.js** - Security middleware tests

### Integration Tests (1 test file)

Located in `backend/tests/`:

1. **tests/errorHandling.integration.test.js** - Error handling integration tests

## Prerequisites

Before running tests, ensure:

1. PostgreSQL is running
2. Test database exists: `glowbyhanka_test`
3. Environment variables are configured in `.env`
4. Dependencies are installed: `npm install`

## Running the Tests

### Option 1: Run All Tests

```bash
cd backend
npm test
```

### Option 2: Run Specific Test Suites

**Run only property-based tests:**

```bash
cd backend
npm test -- tests/properties
```

**Run only unit tests:**

```bash
cd backend
npm test -- src
```

**Run a specific test file:**

```bash
cd backend
npm test -- tests/properties/dataPersistence.property.test.js
```

### Option 3: Use the Test Runner Script

```bash
cd backend
node run-all-tests.js
```

## Expected Results

All tests should pass with:

- ✓ All property-based tests running 100 iterations each
- ✓ All unit tests passing
- ✓ All integration tests passing
- ✓ No errors or failures

## Test Configuration

- **Test Framework**: Jest with ES modules support
- **Property Testing**: fast-check library
- **API Testing**: supertest
- **Test Timeout**: 30 seconds per test
- **Property Test Runs**: 100 iterations per property

## Common Issues and Solutions

### Issue: Database Connection Errors

**Solution**: Ensure PostgreSQL is running and test database exists

```bash
psql -U user -c "CREATE DATABASE glowbyhanka_test;"
```

### Issue: Port Already in Use

**Solution**: The test server uses a different port or mocks the server

### Issue: Email Service Errors

**Solution**: Email service is mocked in tests, no real SMTP needed

### Issue: File Upload Errors

**Solution**: Tests create temporary upload directories automatically

## What to Check

When tests run, verify:

1. ✅ All property tests complete 100 runs successfully
2. ✅ No test timeouts (tests should complete within 30s each)
3. ✅ Database operations work correctly
4. ✅ Authentication and authorization work as expected
5. ✅ File upload and deletion work properly
6. ✅ Contact form validation and email delivery work
7. ✅ Error handling returns Czech language messages
8. ✅ Security middleware is properly configured

## Next Steps

Once all tests pass:

1. Mark this checkpoint as complete
2. Proceed to Task 9: Frontend implementation
3. Keep the backend server running for frontend development

## Troubleshooting

If tests fail:

1. Check the error messages carefully
2. Verify database connection and schema
3. Ensure all migrations have run
4. Check that seed data is present
5. Review the specific test file that's failing
6. Check the test output for specific assertion failures

## Test Coverage

The test suite covers:

- ✅ Data persistence and database operations
- ✅ Authentication and authorization
- ✅ Password security (bcrypt hashing)
- ✅ Protected route access control
- ✅ Image upload and categorization
- ✅ Image deletion
- ✅ Contact form validation
- ✅ Email delivery
- ✅ Error handling with Czech messages
- ✅ Security middleware (rate limiting, request size limits)

---

**Note**: This is a critical checkpoint. All backend tests must pass before proceeding to frontend development to ensure the API is working correctly.
