# Testing Guide

## Prerequisites

Before running tests, you must set up the test database:

1. Create the test database:

```bash
psql -U postgres -c "CREATE DATABASE glowbyhanka_test;"
```

2. Configure your `.env` file with the test database URL:

```
DATABASE_TEST_URL=postgresql://your_username:your_password@localhost:5432/glowbyhanka_test
```

3. Run migrations on the test database:

```bash
NODE_ENV=test npm run migrate
```

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Specific Test File

```bash
npm test -- dataPersistence.property.test.js
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

### Run Tests with Coverage

```bash
npm test -- --coverage
```

## Property-Based Tests

This project uses property-based testing with `fast-check` to verify correctness properties across many randomly generated inputs.

### Property Tests Included

1. **Property 18: Data Persistence** (`tests/properties/dataPersistence.property.test.js`)

   - Validates: Requirements 12.1, 12.2
   - Tests that user, category, and image data persists after database restart
   - Runs 100 iterations per test

2. **Property 19: Database Query Accuracy** (`tests/properties/databaseQueryAccuracy.property.test.js`)
   - Validates: Requirements 12.3
   - Tests that queries return accurate data matching current database state
   - Tests filtering, ordering, and counting operations
   - Runs 100 iterations per test

### Understanding Property Test Output

When a property test fails, fast-check will provide:

- The specific input that caused the failure (counterexample)
- The seed value to reproduce the failure
- The assertion that failed

Example failure output:

```
Property failed after 42 tests
{ seed: 1234567890, path: "42", endOnFailure: true }
Counterexample: { username: "test_abc", email: "test@example.com", ... }
```

To reproduce a failure, use the seed:

```javascript
fc.assert(property, { seed: 1234567890 });
```

## Test Database Management

### Reset Test Database

```bash
# Drop and recreate
psql -U postgres -c "DROP DATABASE glowbyhanka_test;"
psql -U postgres -c "CREATE DATABASE glowbyhanka_test;"

# Run migrations again
NODE_ENV=test npm run migrate
```

### Clean Test Data

The property tests automatically clean up their test data after each run. However, if tests are interrupted, you may need to manually clean:

```bash
psql -U your_username -d glowbyhanka_test

-- Remove test users
DELETE FROM users WHERE username LIKE 'test_%';

-- Remove test categories
DELETE FROM categories WHERE slug LIKE 'test-%';

-- Remove test images
DELETE FROM images WHERE file_path LIKE '/uploads/test/%';
```

## Troubleshooting

### "Connection refused" errors

- Ensure PostgreSQL is running
- Check your DATABASE_TEST_URL in .env
- Verify the test database exists

### "Relation does not exist" errors

- Run migrations on the test database: `NODE_ENV=test npm run migrate`

### Tests timeout

- Increase timeout in jest.config.js (currently 30000ms)
- Check database connection performance
- Ensure test database is not overloaded

### Property tests fail intermittently

- This may indicate a real bug that only occurs with certain inputs
- Note the counterexample and seed value
- Reproduce with the specific seed to debug
