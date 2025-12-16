-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name_cs VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Create index on display_order for sorting
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);
