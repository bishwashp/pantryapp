const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function checkSqliteInstallation() {
  console.log('Checking SQLite installation...');

  try {
    // Try to require sqlite3
    try {
      require('sqlite3');
      console.log('✓ sqlite3 is installed successfully');
    } catch (err) {
      console.log('× sqlite3 installation failed, attempting to fix...');
      
      // Try to reinstall sqlite3
      execSync('npm install sqlite3 --save', { stdio: 'inherit' });
    }

    // Check if data directory exists
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      console.log('Creating data directory...');
      fs.mkdirSync(dataDir, { recursive: true });
    }

    console.log('SQLite setup completed successfully!');
  } catch (error) {
    console.error('Error during SQLite setup:', error);
    process.exit(1);
  }
}

checkSqliteInstallation(); 