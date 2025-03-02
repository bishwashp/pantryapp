const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, '../data/pantry.db');

// Promisify database operations
function runQuery(db, sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function ensureDbDirectory() {
  const dbDir = path.dirname(dbPath);
  try {
    await fs.mkdir(dbDir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      console.error('Error creating database directory:', error);
      throw error;
    }
  }
}

async function optimizeDatabase() {
  await ensureDbDirectory();
  
  const db = new sqlite3.Database(dbPath);
  
  try {
    console.log('Successfully connected to database at:', dbPath);
    console.log('Starting database optimization...');

    // Run VACUUM to reclaim unused space
    console.log('Running VACUUM...');
    await runQuery(db, 'VACUUM;');

    // Analyze tables for query optimization
    console.log('Analyzing tables...');
    await runQuery(db, 'ANALYZE;');

    // Create indexes for commonly queried columns
    console.log('Creating/updating indexes...');
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_items_category ON items(category_id);
      CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
      CREATE INDEX IF NOT EXISTS idx_items_quantity ON items(quantity);
      CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
    `;
    await runQuery(db, createIndexes);

    // Update table statistics
    console.log('Updating table statistics...');
    await runQuery(db, 'ANALYZE sqlite_master;');

    // Optimize database settings
    console.log('Optimizing database settings...');
    const pragmas = [
      'PRAGMA journal_mode = WAL;',
      'PRAGMA synchronous = NORMAL;',
      'PRAGMA temp_store = MEMORY;',
      'PRAGMA mmap_size = 30000000000;',
      'PRAGMA cache_size = -2000;'
    ];

    for (const pragma of pragmas) {
      await runQuery(db, pragma);
    }

    console.log('Database optimization completed successfully!');
  } catch (error) {
    console.error('Error during database optimization:', error);
    if (error.code === 'SQLITE_CANTOPEN') {
      console.error('Could not open database file. Please check if the database exists and you have proper permissions.');
    }
    throw error;
  } finally {
    db.close((err) => {
      if (err) {
        console.error('Error closing database connection:', err);
      } else {
        console.log('Database connection closed successfully.');
      }
    });
  }
}

// Run optimization
optimizeDatabase().catch(error => {
  console.error('Database optimization failed:', error);
  process.exit(1);
}); 