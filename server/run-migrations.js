import pool from './db.js'

async function runMigrations() {
  try {
    // Check and add gender column to products
    const [genderCol] = await pool.query("SHOW COLUMNS FROM products LIKE 'gender'")
    if (genderCol.length === 0) {
      await pool.query("ALTER TABLE products ADD COLUMN gender ENUM('male','female','unisex') DEFAULT NULL AFTER sillage")
      await pool.query('CREATE INDEX idx_products_gender ON products (gender)')
      console.log('✅  Migration applied: products.gender column added')
    } else {
      console.log('ℹ️   products.gender already exists, skipping')
    }

    // Check and create shopping_carts table for user cart persistence
    const [cartsTables] = await pool.query("SHOW TABLES LIKE 'shopping_carts'")
    if (cartsTables.length === 0) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS shopping_carts (
          id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
          user_id       INT UNSIGNED    NOT NULL,
          items         JSON            NOT NULL DEFAULT '[]',
          updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uq_carts_user (user_id),
          CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
      `)
      console.log('✅  Migration applied: shopping_carts table created')
    } else {
      console.log('ℹ️   shopping_carts table already exists, skipping')
    }

    console.log('✅  All migrations complete')
  } catch (err) {
    console.error('❌  Migration error:', err.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runMigrations()
