import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Query function that uses Supabase
export const query = async (text, params = []) => {
  try {
    // Parse the SQL to determine the operation
    const trimmedText = text.trim().toUpperCase();

    if (trimmedText.startsWith("SELECT")) {
      return await handleSelect(text, params);
    } else if (trimmedText.startsWith("INSERT")) {
      return await handleInsert(text, params);
    } else if (trimmedText.startsWith("DELETE")) {
      return await handleDelete(text, params);
    } else if (trimmedText.startsWith("UPDATE")) {
      return await handleUpdate(text, params);
    }

    throw new Error("Unsupported query type");
  } catch (error) {
    console.error("Database query error:", error.message);
    throw error;
  }
};

// Handle SELECT queries
async function handleSelect(text, params) {
  // Extract table name and conditions from SQL
  const tableMatch = text.match(/FROM\s+(\w+)/i);
  if (!tableMatch) throw new Error("Could not parse table name");

  const tableName = tableMatch[1];
  let query = supabase.from(tableName).select("*");

  // Handle WHERE clause
  const whereMatch = text.match(/WHERE\s+(\w+)\s*=\s*\$1/i);
  if (whereMatch && params.length > 0) {
    query = query.eq(whereMatch[1], params[0]);
  }

  // Handle ORDER BY
  const orderMatch = text.match(/ORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?/i);
  if (orderMatch) {
    const ascending = !orderMatch[2] || orderMatch[2].toUpperCase() === "ASC";
    query = query.order(orderMatch[1], { ascending });
  }

  const { data, error } = await query;
  if (error) throw error;

  return { rows: data || [], rowCount: data?.length || 0 };
}

// Handle INSERT queries
async function handleInsert(text, params) {
  const tableMatch = text.match(/INTO\s+(\w+)/i);
  if (!tableMatch) throw new Error("Could not parse table name");

  const tableName = tableMatch[1];

  // Extract column names
  const columnsMatch = text.match(/\(([^)]+)\)\s*VALUES/i);
  if (!columnsMatch) throw new Error("Could not parse columns");

  const columns = columnsMatch[1].split(",").map((c) => c.trim());

  // Build insert object
  const insertData = {};
  columns.forEach((col, index) => {
    if (params[index] !== undefined) {
      insertData[col] = params[index];
    }
  });

  const { data, error } = await supabase
    .from(tableName)
    .insert(insertData)
    .select();

  if (error) throw error;

  return { rows: data || [], rowCount: data?.length || 0 };
}

// Handle DELETE queries
async function handleDelete(text, params) {
  const tableMatch = text.match(/FROM\s+(\w+)/i);
  if (!tableMatch) throw new Error("Could not parse table name");

  const tableName = tableMatch[1];
  let query = supabase.from(tableName).delete();

  // Handle WHERE clause
  const whereMatch = text.match(/WHERE\s+(\w+)\s*=\s*\$1/i);
  if (whereMatch && params.length > 0) {
    query = query.eq(whereMatch[1], params[0]);
  }

  const { data, error } = await query.select();
  if (error) throw error;

  return { rows: data || [], rowCount: data?.length || 0 };
}

// Handle UPDATE queries
async function handleUpdate(text, params) {
  const tableMatch = text.match(/UPDATE\s+(\w+)/i);
  if (!tableMatch) throw new Error("Could not parse table name");

  const tableName = tableMatch[1];

  // This is a simplified version - for complex updates, extend as needed
  const { data, error } = await supabase.from(tableName).update({}).select();

  if (error) throw error;

  return { rows: data || [], rowCount: data?.length || 0 };
}

// Test connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("id")
      .limit(1);
    if (error) throw error;
    console.log("Database connection established successfully");
    return true;
  } catch (error) {
    console.error("Database connection failed:", error.message);
    throw error;
  }
};

// For compatibility
export const getClient = async () => supabase;
export const closePool = async () => {};

export default supabase;
