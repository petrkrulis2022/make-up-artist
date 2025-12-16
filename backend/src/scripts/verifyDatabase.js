import { query, testConnection, closePool } from "../config/database.js";

// Verify database setup
const verifyDatabase = async () => {
  console.log("🔍 Verifying database setup...\n");

  try {
    // Test connection
    console.log("1. Testing database connection...");
    await testConnection();
    console.log("   ✅ Connection successful\n");

    // Check tables exist
    console.log("2. Checking tables...");
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const tables = tablesResult.rows.map((row) => row.table_name);
    const expectedTables = ["users", "categories", "images"];

    for (const table of expectedTables) {
      if (tables.includes(table)) {
        console.log(`   ✅ Table '${table}' exists`);
      } else {
        console.log(`   ❌ Table '${table}' missing - run 'npm run migrate'`);
      }
    }
    console.log("");

    // Check categories
    console.log("3. Checking categories...");
    const categoriesResult = await query(
      "SELECT name_cs, slug FROM categories ORDER BY display_order"
    );

    if (categoriesResult.rows.length === 0) {
      console.log("   ⚠️  No categories found - run 'npm run seed'");
    } else {
      console.log(`   ✅ Found ${categoriesResult.rows.length} categories:`);
      categoriesResult.rows.forEach((cat) => {
        console.log(`      - ${cat.name_cs} (${cat.slug})`);
      });
    }
    console.log("");

    // Check users
    console.log("4. Checking users...");
    const usersResult = await query("SELECT username, email FROM users");

    if (usersResult.rows.length === 0) {
      console.log("   ⚠️  No users found - run 'npm run seed'");
    } else {
      console.log(`   ✅ Found ${usersResult.rows.length} user(s):`);
      usersResult.rows.forEach((user) => {
        console.log(`      - ${user.username} (${user.email})`);
      });
    }
    console.log("");

    // Check indexes
    console.log("5. Checking indexes...");
    const indexesResult = await query(`
      SELECT tablename, indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename IN ('users', 'categories', 'images')
      ORDER BY tablename, indexname
    `);

    console.log(`   ✅ Found ${indexesResult.rows.length} indexes`);
    console.log("");

    console.log("✨ Database verification complete!\n");

    if (categoriesResult.rows.length === 0 || usersResult.rows.length === 0) {
      console.log("💡 Tip: Run 'npm run seed' to populate initial data\n");
    }
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    console.error("\n💡 Troubleshooting:");
    console.error("   1. Ensure PostgreSQL is running");
    console.error("   2. Check your DATABASE_URL in .env");
    console.error("   3. Run 'npm run migrate' to create tables");
    console.error("   4. See DATABASE_SETUP.md for detailed instructions\n");
  } finally {
    await closePool();
  }
};

// Run verification
verifyDatabase();
