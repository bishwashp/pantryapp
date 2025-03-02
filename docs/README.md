# Pantry Tracker Documentation

## Overview
Pantry Tracker is a desktop application built with Electron that helps users manage their pantry inventory efficiently. The application provides features for tracking items, categories, and inventory levels with an intuitive user interface.

## Table of Contents
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [Development](#development)
- [Performance Considerations](#performance-considerations)
- [Troubleshooting](#troubleshooting)

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Setup Steps
1. Clone the repository
```bash
git clone https://github.com/yourusername/pantry-tracker.git
cd pantry-tracker
```

2. Install dependencies
```bash
npm install
```

3. Create environment file
```bash
cp .env.example .env
```
Edit the `.env` file with your configuration values.

4. Start the application
```bash
npm start
```

## Configuration
The application uses environment variables for configuration. See `.env.example` for available options:
- `NODE_ENV`: Application environment (development/production)
- `DB_PATH`: SQLite database location
- `LOG_LEVEL`: Logging level (error/warn/info/debug)

## Usage Guide
1. **Adding Items**
   - Click the "Add Item" button on the home page
   - Fill in item details
   - Select or create a category
   - Set initial quantity

2. **Managing Categories**
   - Navigate to Settings
   - Use "Add Category" to create new categories
   - Edit existing categories as needed

3. **Tracking Inventory**
   - Update quantities from the home page
   - View usage trends in the analytics section
   - Set low stock alerts in settings

## Development

### Project Structure
```
pantry-tracker/
├── config/           # Configuration files
├── docs/            # Documentation
├── src/             # Source code
├── tests/           # Test files
└── logs/            # Application logs
```

### Key Technologies
- Electron
- SQLite3
- Chart.js
- Winston (logging)

### Performance Optimizations
- Database query optimization
- Lazy loading implementation
- Caching strategies
- Resource management

## Troubleshooting
Common issues and their solutions:
1. **Database Connection Issues**
   - Verify DB_PATH in .env
   - Check file permissions
   - Ensure no other process is locking the database

2. **Performance Issues**
   - Clear application cache
   - Check log files for errors
   - Verify system resources

## Support
For issues and feature requests, please create an issue in the repository. 