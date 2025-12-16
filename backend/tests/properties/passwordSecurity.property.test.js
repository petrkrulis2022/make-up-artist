import fc from "fast-check";
import { hashPassword } from "../../src/services/authService.js";
import { query, testConnection, closePool } from "../../src/config/database.js";

// Feature: makeup-artist-website, Property 20: Password security
// Validates: Requirements 12.4

describe("Property 20: Password security", () => {
  test("For any password, hashing the same password twice should produce different hashes (salt verification)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 6, maxLength: 30 }),
        async (password) => {
          // Hash the same password twice
          const hash1 = await hashPassword(password);
          const hash2 = await hashPassword(password);

          // Verify hashes are different (due to different salts)
          expect(hash1).not.toBe(hash2);

          // Verify both are valid bcrypt hashes
          expect(hash1).toMatch(/^\$2[ab]\$/);
          expect(hash2).toMatch(/^\$2[ab]\$/);
          expect(hash1.length).toBe(60);
          expect(hash2.length).toBe(60);
        }
      ),
      { numRuns: 100 }
    );
  });

  test("For any password hash, it should use bcrypt with minimum 10 rounds", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 6, maxLength: 30 }),
        async (password) => {
          // Hash the password using our service
          const passwordHash = await hashPassword(password);

          // Extract the cost factor (rounds) from bcrypt hash
          // Bcrypt hash format: $2b$10$... where 10 is the cost factor
          const costFactorMatch = passwordHash.match(/^\$2[ab]\$(\d+)\$/);
          expect(costFactorMatch).not.toBeNull();

          const costFactor = parseInt(costFactorMatch[1]);

          // Verify cost factor is at least 10
          expect(costFactor).toBeGreaterThanOrEqual(10);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Property 20: Password security (Database tests)", () => {
  beforeAll(async () => {
    // Ensure we're using test database
    process.env.NODE_ENV = "test";
    await testConnection();
  });

  afterAll(async () => {
    await closePool();
  });

  test("For any admin password stored in database, the password should be hashed (not stored in plain text)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          username: fc
            .string({ minLength: 3, maxLength: 20 })
            .filter((s) => /^[a-zA-Z0-9_]+$/.test(s)),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 6, maxLength: 30 }),
        }),
        async (userData) => {
          const testUsername = `test_pwd_${userData.username}_${Date.now()}`;

          try {
            // Hash the password
            const passwordHash = await hashPassword(userData.password);

            // Store user with hashed password
            const insertResult = await query(
              "INSERT INTO users (username, password_hash, email) VALUES ($1, $2, $3) RETURNING id, password_hash",
              [testUsername, passwordHash, userData.email]
            );

            const storedPasswordHash = insertResult.rows[0].password_hash;
            const userId = insertResult.rows[0].id;

            // Verify password is not stored in plain text
            expect(storedPasswordHash).not.toBe(userData.password);

            // Verify stored hash is actually a bcrypt hash (starts with $2b$ or $2a$)
            expect(storedPasswordHash).toMatch(/^\$2[ab]\$/);

            // Verify hash has sufficient length (bcrypt hashes are 60 characters)
            expect(storedPasswordHash.length).toBe(60);

            // Query the user from database
            const queryResult = await query(
              "SELECT password_hash FROM users WHERE id = $1",
              [userId]
            );

            // Verify the password_hash in database is not plain text
            expect(queryResult.rows[0].password_hash).not.toBe(
              userData.password
            );
            expect(queryResult.rows[0].password_hash).toBe(storedPasswordHash);

            // Cleanup
            await query("DELETE FROM users WHERE username = $1", [
              testUsername,
            ]);
          } catch (error) {
            await query("DELETE FROM users WHERE username = $1", [
              testUsername,
            ]);
            throw error;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
