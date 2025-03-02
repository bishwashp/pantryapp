# API Documentation

## Database API

### Items

#### `getItems(options)`
Retrieves items from the database.

**Parameters:**
- `options` (Object)
  - `limit` (Number): Maximum number of items to return
  - `offset` (Number): Number of items to skip
  - `category` (String): Filter by category
  - `search` (String): Search term for item name

**Returns:**
- Promise<Array> of item objects

#### `addItem(item)`
Adds a new item to the database.

**Parameters:**
- `item` (Object)
  - `name` (String): Item name
  - `category` (String): Category name
  - `quantity` (Number): Current quantity
  - `unit` (String): Unit of measurement
  - `minQuantity` (Number): Minimum quantity for alerts

**Returns:**
- Promise<Object> newly created item

### Categories

#### `getCategories()`
Retrieves all categories.

**Returns:**
- Promise<Array> of category objects

#### `addCategory(category)`
Adds a new category.

**Parameters:**
- `category` (Object)
  - `name` (String): Category name
  - `description` (String): Category description

**Returns:**
- Promise<Object> newly created category

## Security API

### Encryption

#### `encryption.encrypt(text)`
Encrypts sensitive data.

**Parameters:**
- `text` (String): Text to encrypt

**Returns:**
- String: Encrypted text

#### `encryption.decrypt(ciphertext)`
Decrypts encrypted data.

**Parameters:**
- `ciphertext` (String): Encrypted text

**Returns:**
- String: Decrypted text

### Input Sanitization

#### `sanitize.cleanInput(input)`
Sanitizes string input.

**Parameters:**
- `input` (String): Input to sanitize

**Returns:**
- String: Sanitized input

#### `sanitize.cleanObject(obj)`
Recursively sanitizes object properties.

**Parameters:**
- `obj` (Object): Object to sanitize

**Returns:**
- Object: Sanitized object

## Performance API

### Caching

#### `cache.set(key, value, ttl)`
Sets a value in cache.

**Parameters:**
- `key` (String): Cache key
- `value` (Any): Value to cache
- `ttl` (Number): Time to live in seconds

**Returns:**
- Promise<void>

#### `cache.get(key)`
Retrieves a value from cache.

**Parameters:**
- `key` (String): Cache key

**Returns:**
- Promise<Any> cached value or null

### Lazy Loading

#### `lazyLoad.getItems(options)`
Retrieves items with lazy loading.

**Parameters:**
- `options` (Object)
  - `page` (Number): Page number
  - `pageSize` (Number): Items per page
  - `category` (String): Category filter

**Returns:**
- Promise<Object> with items and metadata

## Logging API

### Logger

#### `logger.log(level, message, meta)`
Logs a message with specified level.

**Parameters:**
- `level` (String): Log level (error/warn/info/debug)
- `message` (String): Log message
- `meta` (Object): Additional metadata

**Returns:**
- void

## Events

### Application Events

#### `on('lowStock', callback)`
Triggered when item quantity falls below minimum.

**Callback Parameters:**
- `item` (Object): Item that triggered the alert

#### `on('error', callback)`
Triggered on application errors.

**Callback Parameters:**
- `error` (Error): Error object
- `context` (Object): Error context

## Configuration

### Environment Variables

- `NODE_ENV`: Application environment
- `DB_PATH`: Database file location
- `LOG_LEVEL`: Logging level
- `DB_ENCRYPTION_KEY`: Database encryption key
- `SESSION_SECRET`: Session secret key 