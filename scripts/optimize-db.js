let Database;
try {
  Database = require('better-sqlite3');
} catch (err) {
  console.log('better-sqlite3 not found, falling back to sqlite3...');
  const sqlite3 = require('sqlite3').verbose();
  // Create a promise-based wrapper for sqlite3
  Database = class {
    constructor(dbPath) {
      this.db = new sqlite3.Database(dbPath);
    }

    exec(sql) {
      return new Promise((resolve, reject) => {
        this.db.exec(sql, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    pragma(setting) {
      return new Promise((resolve, reject) => {
        this.db.exec(`PRAGMA ${setting};`, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    close() {
      return new Promise((resolve, reject) => {
        this.db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  };
}

const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, '../data/pantry.db');

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
  
  let db;
  try {
    db = new Database(dbPath);
    console.log('Successfully connected to database at:', dbPath);
    
    console.log('Starting database optimization...');

    // Run VACUUM to reclaim unused space
    console.log('Running VACUUM...');
    await db.exec('VACUUM;');

    // Analyze tables for query optimization
    console.log('Analyzing tables...');
    await db.exec('ANALYZE;');

    // Create indexes for commonly queried columns
    console.log('Creating/updating indexes...');
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_items_category ON items(category_id);
      CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
      CREATE INDEX IF NOT EXISTS idx_items_quantity ON items(quantity);
      CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
    `;
    await db.exec(createIndexes);

    // Update table statistics
    console.log('Updating table statistics...');
    await db.exec('ANALYZE sqlite_master;');

    // Optimize database settings
    console.log('Optimizing database settings...');
    await db.pragma('journal_mode = WAL');
    await db.pragma('synchronous = NORMAL');
    await db.pragma('temp_store = MEMORY');
    await db.pragma('mmap_size = 30000000000');
    await db.pragma('cache_size = -2000'); // Use 2MB of cache

    console.log('Database optimization completed successfully!');
  } catch (error) {
    console.error('Error during database optimization:', error);
    if (error.code === 'SQLITE_CANTOPEN') {
      console.error('Could not open database file. Please check if the database exists and you have proper permissions.');
    }
    throw error;
  } finally {
    if (db) {
      try {
        await db.close();
        console.log('Database connection closed successfully.');
      } catch (closeError) {
        console.error('Error closing database connection:', closeError);
      }
    }
  }
}

// Run optimization
optimizeDatabase().catch(error => {
  console.error('Database optimization failed:', error);
  process.exit(1);
}); 