import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// Determine which database URL to use based on NODE_ENV
const databaseUrl =
  process.env.NODE_ENV === "test"
    ? process.env.DATABASE_TEST_URL
    : process.env.DATABASE_URL;

// Create connection pool
const pool = new Pool({
  connectionString: databaseUrl,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
});

// Handle pool errors
pool.on("error", (err, client) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

// Test connection function
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log("Database connection established successfully");
    client.release();
    return true;
  } catch (error) {
    console.error("Database connection failed:", error.message);
    throw error;
  }
};

// Query function with error handling
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log("Executed query", { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error("Database query error:", error.message);
    throw error;
  }
};

// Get a client from the pool for transactions
export const getClient = async () => {
  try {
    const client = await pool.connect();
    return client;
  } catch (error) {
    console.error("Failed to get database client:", error.message);
    throw error;
  }
};

// Close pool (useful for graceful shutdown)
export const closePool = async () => {
  try {
    await pool.end();
    console.log("Database pool closed");
  } catch (error) {
    console.error("Error closing database pool:", error.message);
    throw error;
  }
};

export default pool;
