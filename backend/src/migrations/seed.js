import bcrypt from "bcrypt";
import { query, testConnection, closePool } from "../config/database.js";

// Seed categories
const seedCategories = async () => {
  console.log("Seeding categories...");

  const categories = [
    { name_cs: "Svatební líčení", slug: "svatebni-liceni", display_order: 1 },
    {
      name_cs: "Líčení na plesy a večírky",
      slug: "liceni-na-plesy-a-vecirky",
      display_order: 2,
    },
    {
      name_cs: "Slavnostní líčení",
      slug: "slavnostni-liceni",
      display_order: 3,
    },
    {
      name_cs: "Líčení pro focení",
      slug: "liceni-pro-foceni",
      display_order: 4,
    },
  ];

  for (const category of categories) {
    try {
      // Check if category already exists
      const existing = await query(
        "SELECT id FROM categories WHERE slug = $1",
        [category.slug]
      );

      if (existing.rows.length === 0) {
        await query(
          "INSERT INTO categories (name_cs, slug, display_order) VALUES ($1, $2, $3)",
          [category.name_cs, category.slug, category.display_order]
        );
        console.log(`✓ Created category: ${category.name_cs}`);
      } else {
        console.log(`- Category already exists: ${category.name_cs}`);
      }
    } catch (error) {
      console.error(
        `✗ Failed to create category ${category.name_cs}:`,
        error.message
      );
      throw error;
    }
  }
};

// Seed admin user
const seedAdminUser = async () => {
  console.log("Seeding admin user...");

  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const adminEmail = process.env.ADMIN_EMAIL || "admin@glowbyhanka.cz";

  try {
    // Check if admin user already exists
    const existing = await query("SELECT id FROM users WHERE username = $1", [
      adminUsername,
    ]);

    if (existing.rows.length === 0) {
      // Hash password with bcrypt (minimum 10 rounds as per requirements)
      const passwordHash = await bcrypt.hash(adminPassword, 10);

      await query(
        "INSERT INTO users (username, password_hash, email) VALUES ($1, $2, $3)",
        [adminUsername, passwordHash, adminEmail]
      );
      console.log(`✓ Created admin user: ${adminUsername}`);
      console.log(`  Email: ${adminEmail}`);
      console.log(`  Password: ${adminPassword} (change this in production!)`);
    } else {
      console.log(`- Admin user already exists: ${adminUsername}`);
    }
  } catch (error) {
    console.error("✗ Failed to create admin user:", error.message);
    throw error;
  }
};

// Run all seed operations
export const runSeed = async () => {
  try {
    console.log("Starting database seeding...");

    // Test connection first
    await testConnection();

    // Seed categories
    await seedCategories();

    // Seed admin user
    await seedAdminUser();

    console.log("All seed operations completed successfully");
  } catch (error) {
    console.error("Seeding failed:", error.message);
    throw error;
  }
};

// Run seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeed()
    .then(() => {
      console.log("Seed process completed");
      closePool();
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seed process failed:", error);
      closePool();
      process.exit(1);
    });
}
