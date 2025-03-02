const CryptoJS = require('crypto-js');
const sanitizeHtml = require('sanitize-html');
require('dotenv').config();

const encryptionKey = process.env.DB_ENCRYPTION_KEY;

// Encryption utilities
const encryption = {
  encrypt: (text) => {
    try {
      return CryptoJS.AES.encrypt(text, encryptionKey).toString();
    } catch (error) {
      logger.error('Encryption error:', error);
      throw new Error('Encryption failed');
    }
  },

  decrypt: (ciphertext) => {
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, encryptionKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      logger.error('Decryption error:', error);
      throw new Error('Decryption failed');
    }
  }
};

// Input sanitization options
const sanitizeOptions = {
  allowedTags: ['b', 'i', 'em', 'strong', 'a'],
  allowedAttributes: {
    'a': ['href']
  },
  allowedIframeHostnames: []
};

// Input sanitization utility
const sanitize = {
  cleanInput: (input) => {
    if (typeof input !== 'string') return input;
    return sanitizeHtml(input, sanitizeOptions);
  },

  cleanObject: (obj) => {
    if (typeof obj !== 'object') return obj;
    
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        cleaned[key] = sanitizeHtml(value, sanitizeOptions);
      } else if (typeof value === 'object' && value !== null) {
        cleaned[key] = sanitize.cleanObject(value);
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }
};

module.exports = {
  encryption,
  sanitize
}; 