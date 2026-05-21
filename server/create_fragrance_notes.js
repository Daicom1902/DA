import pool from './db.js'

try {
  // Check products.id column type first
  const [cols] = await pool.query("SHOW COLUMNS FROM products WHERE Field = 'id'")
  console.log('products.id type:', cols[0].Type)
  
  // Create table without FK first, then add FK
  await pool.query(`
    CREATE TABLE IF NOT EXISTS fragrance_notes (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      product_id INT UNSIGNED NOT NULL,
      layer ENUM('top','heart','base') NOT NULL,
      note VARCHAR(100) NOT NULL,
      INDEX idx_product_id (product_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)
  console.log('✅ Table fragrance_notes created successfully!')
} catch (e) {
  console.error('❌ ERROR:', e.message)
} finally {
  process.exit()
}
