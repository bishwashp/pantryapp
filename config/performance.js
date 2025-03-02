const path = require('path');
require('dotenv').config();

// Cache configuration
const cacheConfig = {
  // In-memory cache settings
  memory: {
    maxItems: 1000,
    ttl: 3600, // 1 hour in seconds
    checkPeriod: 600, // Cleanup every 10 minutes
  },
  
  // Disk cache settings
  disk: {
    path: path.join(__dirname, '../cache'),
    maxSize: 104857600, // 100MB in bytes
    ttl: 86400, // 24 hours in seconds
  }
};

// Database optimization settings
const dbConfig = {
  // Query timeout
  queryTimeout: 5000, // 5 seconds
  
  // Connection pool settings
  pool: {
    min: 0,
    max: 7,
    idleTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    acquireTimeoutMillis: 30000,
  },
  
  // Query batch size for large operations
  batchSize: 100,
};

// Resource management settings
const resourceConfig = {
  // Memory management
  memory: {
    maxHeapSize: '512M',
    gcInterval: 3600000, // 1 hour in milliseconds
  },
  
  // Image optimization
  images: {
    maxWidth: 800,
    maxHeight: 600,
    quality: 0.8,
    format: 'webp',
  }
};

// Lazy loading configuration
const lazyLoadConfig = {
  // Number of items to load initially
  initialLoad: 20,
  
  // Number of items to load per batch
  batchSize: 10,
  
  // Threshold before loading next batch (pixels)
  threshold: 100,
};

// Performance monitoring settings
const monitoringConfig = {
  // Metrics collection interval
  metricsInterval: 60000, // 1 minute
  
  // Slow query threshold
  slowQueryThreshold: 1000, // 1 second
  
  // Performance logging
  logging: {
    enabled: true,
    level: 'warn',
    file: path.join(__dirname, '../logs/performance.log'),
  }
};

module.exports = {
  cacheConfig,
  dbConfig,
  resourceConfig,
  lazyLoadConfig,
  monitoringConfig,
}; 