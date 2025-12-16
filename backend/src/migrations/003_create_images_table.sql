-- Create images table
CREATE TABLE IF NOT EXISTS images (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  uploaded_by INTEGER NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  display_order INTEGER DEFAULT 0
);

-- Create index on category_id for faster category-based queries
CREATE INDEX IF NOT EXISTS idx_images_category ON images(category_id);

-- Create index on display_order for sorting
CREATE INDEX IF NOT EXISTS idx_images_display_order ON images(display_order);

-- Create composite index for category and display order queries
CREATE INDEX IF NOT EXISTS idx_images_category_display_order ON images(category_id, display_order);
