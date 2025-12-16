import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { query, testConnection, closePool } from "../config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all migration files in order
const getMigrationFiles = () => {
  const files = fs
    .readdirSync(__dirname)
    .filter((file) => file.endsWith(".sql"))
    .sort();
  return files;
};

// Run a single migration file
const runMigration = async (filename) => {
  const filePath = path.join(__dirname, filename);
  const sql = fs.readFileSync(filePath, "utf8");

  console.log(`Running migration: ${filename}`);

  try {
    await query(sql);
    console.log(`✓ Migration ${filename} completed successfully`);
    return true;
  } catch (error) {
    console.error(`✗ Migration ${filename} failed:`, error.message);
    throw error;
  }
};

// Run all migrations
export const runMigrations = async () => {
  try {
    console.log("Starting database migrations...");

    // Test connection first
    await testConnection();

    const migrationFiles = getMigrationFiles();

    if (migrationFiles.length === 0) {
      console.log("No migration files found");
      return;
    }

    for (const file of migrationFiles) {
      await runMigration(file);
    }

    console.log("All migrations completed successfully");
  } catch (error) {
    console.error("Migration failed:", error.message);
    throw error;
  }
};

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => {
      console.log("Migration process completed");
      closePool();
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration process failed:", error);
      closePool();
      process.exit(1);
    });
}
