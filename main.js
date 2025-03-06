const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

let mainWindow;
let db;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  
  // Check if we should load the debug page
  const shouldDebug = process.argv.includes('--debug');
  
  if (shouldDebug) {
    console.log('Loading debug page');
    mainWindow.loadFile('debug.html');
    // Open dev tools automatically in debug mode
    mainWindow.webContents.openDevTools();
  } else {
    console.log('Loading main app');
    mainWindow.loadFile('index.html');
  }
}

function initializeDatabase() {
  // Determine if we're in development mode
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  console.log('App is running in', isDev ? 'development' : 'production', 'mode');
  
  // Choose the appropriate database path based on mode
  let dbPath;
  if (isDev) {
    // Use a local data directory in development mode
    const dataDir = path.join(__dirname, 'data');
    // Create data directory if it doesn't exist
    if (!require('fs').existsSync(dataDir)) {
      require('fs').mkdirSync(dataDir, { recursive: true });
    }
    dbPath = path.join(dataDir, 'pantry.db');
    console.log('Using development database at:', dbPath);
  } else {
    // Use the standard user data path in production
    dbPath = path.join(app.getPath('userData'), 'pantry.db');
    console.log('Using production database at:', dbPath);
  }
  
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Database initialization error:', err);
    } else {
      console.log('Database initialized successfully');
    }
  });

  db.serialize(() => {
    console.log('Creating database tables...');
    db.run(`CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    )`, (err) => {
      if (err) console.error('Error creating categories table:', err);
      else {
        console.log('Categories table ready');
        // Create Uncategorized category if it doesn't exist
        db.get('SELECT id FROM categories WHERE name = ?', ['Uncategorized'], (err, row) => {
          if (err) {
            console.error('Error checking for Uncategorized category:', err);
          } else if (!row) {
            db.run('INSERT INTO categories (name) VALUES (?)', ['Uncategorized'], (err) => {
              if (err) console.error('Error creating Uncategorized category:', err);
              else console.log('Created Uncategorized category');
            });
          }
        });
      }
    });

    db.run(`CREATE TABLE IF NOT EXISTS stocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      full_value REAL,
      unit TEXT,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )`, (err) => {
      if (err) console.error('Error creating stocks table:', err);
      else console.log('Stocks table ready');
    });

    db.run(`CREATE TABLE IF NOT EXISTS stock_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stock_id INTEGER NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      percentage REAL NOT NULL,
      FOREIGN KEY (stock_id) REFERENCES stocks(id)
    )`, (err) => {
      if (err) console.error('Error creating stock_history table:', err);
      else console.log('Stock history table ready');
    });

    // Check if we have any data
    db.get('SELECT COUNT(*) as count FROM categories', (err, row) => {
      if (err) console.error('Error checking categories:', err);
      else console.log('Number of categories:', row.count);
    });

    db.get('SELECT COUNT(*) as count FROM stocks', (err, row) => {
      if (err) console.error('Error checking stocks:', err);
      else console.log('Number of stocks:', row.count);
    });
  });
}

app.whenReady().then(() => {
  initializeDatabase();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// IPC Handlers
ipcMain.handle('get-categories', async () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM categories', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});

ipcMain.handle('add-category', async (event, name) => {
  console.log('Main process: add-category handler called with name:', name);
  return new Promise((resolve, reject) => {
    // Convert to sentence case: first letter uppercase, rest lowercase
    const sentenceCaseName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    console.log('Main process: Inserting category with name:', sentenceCaseName);
    
    // First check if this category already exists
    db.get('SELECT id FROM categories WHERE LOWER(name) = LOWER(?)', [sentenceCaseName], (err, row) => {
      if (err) {
        console.error('Main process: Error checking for existing category:', err);
        reject(err);
        return;
      }
      
      if (row) {
        console.log('Main process: Category already exists with ID:', row.id);
        reject(new Error('A category with this name already exists'));
        return;
      }
      
      // Insert the new category
      db.run('INSERT INTO categories (name) VALUES (?)', [sentenceCaseName], function(err) {
        if (err) {
          console.error('Main process: Error inserting category:', err);
          reject(err);
        } else {
          const newId = this.lastID;
          console.log('Main process: Category inserted successfully with ID:', newId);
          
          // Verify the category was added
          db.get('SELECT * FROM categories WHERE id = ?', [newId], (err, row) => {
            if (err) {
              console.error('Main process: Error verifying new category:', err);
              // Still resolve with the ID since the insert succeeded
              resolve(newId);
            } else {
              console.log('Main process: Verified new category:', row);
              resolve(newId);
            }
          });
        }
      });
    });
  });
});

ipcMain.handle('delete-category', async (event, id) => {
  return new Promise((resolve, reject) => {
    // First check if this is the Uncategorized category
    db.get('SELECT name FROM categories WHERE id = ?', [id], (err, category) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (category.name === 'Uncategorized') {
        reject(new Error('Cannot delete the Uncategorized category'));
        return;
      }

      // Check if category has items
      db.get('SELECT COUNT(*) as count FROM stocks WHERE category_id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (row.count > 0) {
          // Get the Uncategorized category ID
          db.get('SELECT id FROM categories WHERE name = ?', ['Uncategorized'], (err, uncatRow) => {
            if (err) {
              reject(err);
              return;
            }
            
            if (!uncatRow) {
              reject(new Error('Uncategorized category not found'));
              return;
            }

            // Move all items to Uncategorized category
            db.run('UPDATE stocks SET category_id = ? WHERE category_id = ?', [uncatRow.id, id], (err) => {
              if (err) {
                reject(err);
                return;
              }

              // Now delete the category
              db.run('DELETE FROM categories WHERE id = ?', [id], (err) => {
                if (err) reject(err);
                else resolve();
              });
            });
          });
        } else {
          // No items, just delete the category
          db.run('DELETE FROM categories WHERE id = ?', [id], (err) => {
            if (err) reject(err);
            else resolve();
          });
        }
      });
    });
  });
});

ipcMain.handle('get-stocks-with-latest', async () => {
  return new Promise((resolve, reject) => {
    console.log('Fetching stocks with latest percentages...');
    db.all(`
      SELECT 
        s.id, 
        s.name, 
        s.category_id, 
        s.type, 
        s.full_value, 
        s.unit, 
        c.name as category_name, 
        COALESCE(h.percentage, 100) as percentage
      FROM stocks s
      JOIN categories c ON s.category_id = c.id
      LEFT JOIN (
        SELECT stock_id, MAX(timestamp) as max_ts
        FROM stock_history
        GROUP BY stock_id
      ) latest ON s.id = latest.stock_id
      LEFT JOIN stock_history h ON latest.stock_id = h.stock_id AND latest.max_ts = h.timestamp
      ORDER BY h.percentage ASC NULLS LAST
    `, (err, rows) => {
      if (err) {
        console.error('Database error in get-stocks-with-latest:', err);
        reject(err);
      } else {
        console.log('Retrieved stocks:', rows);
        if (!rows || rows.length === 0) {
          console.log('No stocks found in database');
        } else {
          console.log('Found', rows.length, 'stocks');
          rows.forEach(row => {
            console.log('Stock:', {
              id: row.id,
              name: row.name,
              category: row.category_name,
              percentage: row.percentage
            });
          });
        }
        resolve(rows);
      }
    });
  });
});

ipcMain.handle('add-stock', async (event, stock) => {
  const { name, category_id, type, full_value, unit, percentage } = stock;
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO stocks (name, category_id, type, full_value, unit) VALUES (?, ?, ?, ?, ?)',
      [name, category_id, type, full_value, unit],
      function(err) {
        if (err) reject(err);
        else {
          const stockId = this.lastID;
          db.run(
            'INSERT INTO stock_history (stock_id, percentage) VALUES (?, ?)',
            [stockId, percentage],
            (err) => {
              if (err) reject(err);
              else resolve(stockId);
            }
          );
        }
      }
    );
  });
});

ipcMain.handle('update-stock', async (event, stock) => {
  const { id, name, category_id, type, full_value, unit, percentage } = stock;
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE stocks SET name = ?, category_id = ?, type = ?, full_value = ?, unit = ? WHERE id = ?',
      [name, category_id, type, full_value, unit, id],
      (err) => {
        if (err) reject(err);
        else {
          db.run(
            'INSERT INTO stock_history (stock_id, percentage) VALUES (?, ?)',
            [id, percentage],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        }
      }
    );
  });
});

ipcMain.handle('delete-stock', async (event, id) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM stock_history WHERE stock_id = ?', [id], (err) => {
      if (err) reject(err);
      else {
        db.run('DELETE FROM stocks WHERE id = ?', [id], (err) => {
          if (err) reject(err);
          else resolve();
        });
      }
    });
  });
});

ipcMain.handle('get-history', async () => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT h.timestamp, h.percentage, s.name
      FROM stock_history h
      JOIN stocks s ON h.stock_id = s.id
      ORDER BY h.timestamp
    `, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});

// Debug handlers
ipcMain.handle('debug-get-database-path', async () => {
  const userDataPath = app.getPath('userData');
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  
  let dbPath;
  if (isDev) {
    dbPath = path.join(__dirname, 'data', 'pantry.db');
  } else {
    dbPath = path.join(userDataPath, 'pantry.db');
  }
  
  return {
    userDataPath,
    dbPath,
    isDev,
    appPath: app.getAppPath(),
    cwd: process.cwd(),
  };
});

ipcMain.handle('debug-inspect-categories', async () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM categories', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});

ipcMain.handle('debug-add-test-category', async (event, name) => {
  console.log('[DEBUG] Adding test category:', name);
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO categories (name) VALUES (?)', [name], function(err) {
      if (err) {
        console.error('[DEBUG] Error inserting test category:', err);
        reject(err);
      } else {
        const newId = this.lastID;
        console.log('[DEBUG] Test category inserted with ID:', newId);
        
        // Verify the category was added
        db.all('SELECT * FROM categories', (err, rows) => {
          if (err) {
            console.error('[DEBUG] Error verifying categories after insert:', err);
          } else {
            console.log('[DEBUG] All categories after insert:', rows);
          }
          resolve(newId);
        });
      }
    });
  });
});