/**
 * Configuration management for cc-discord
 * Handles encrypted storage of Discord bot token and user ID
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

// Encryption settings
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Generate machine-specific encryption key
function getMachineKey() {
  const machineId = os.hostname() + os.userInfo().username + os.platform();
  return crypto.createHash('sha256').update(machineId).digest();
}

// Encrypt sensitive data
function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getMachineKey(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

// Decrypt sensitive data
function decrypt(encryptedText) {
  if (!encryptedText) return null;
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) return encryptedText; // Not encrypted
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    const decipher = crypto.createDecipheriv(ALGORITHM, getMachineKey(), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    return encryptedText; // Return as-is if decryption fails
  }
}

// Current working directory for config
let currentCwd = process.cwd();

// Config cache
let configCache = null;

/**
 * Set the current working directory
 */
function setCwd(dir) {
  currentCwd = dir;
  configCache = null;
}

/**
 * Get the data directory path (.cc-discord folder)
 */
function getDataDir() {
  return path.join(currentCwd, '.cc-discord');
}

/**
 * Check if config file exists
 */
function configExists() {
  const configPath = path.join(getDataDir(), 'config.json');
  return fs.existsSync(configPath);
}

/**
 * Load configuration from file
 */
function loadConfig() {
  if (configCache) return configCache;

  const configPath = path.join(getDataDir(), 'config.json');

  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    const data = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(data);

    // Decrypt sensitive fields
    configCache = {
      ...config,
      botToken: decrypt(config.botToken),
      userId: decrypt(config.userId),
      clientId: decrypt(config.clientId)
    };

    return configCache;
  } catch (e) {
    console.error('Failed to load config:', e.message);
    return null;
  }
}

/**
 * Save configuration to file
 */
function saveConfig(config) {
  const dataDir = getDataDir();

  // Create data directory if not exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Create subdirectories
  const subDirs = ['tasks', 'completed', 'failed', 'logs'];
  for (const dir of subDirs) {
    const dirPath = path.join(dataDir, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  // Encrypt sensitive fields before saving
  const configToSave = {
    ...config,
    botToken: encrypt(config.botToken),
    userId: encrypt(config.userId),
    clientId: encrypt(config.clientId)
  };

  const configPath = path.join(dataDir, 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(configToSave, null, 2));

  // Update cache with unencrypted values
  configCache = config;
}

/**
 * Clear config cache
 */
function clearConfigCache() {
  configCache = null;
}

/**
 * Get default config values
 */
function getDefaultConfig() {
  return {
    botToken: null,
    clientId: null,
    userId: null,
    debugMode: false,
    claudeCommand: null, // Will be auto-detected
    logRetentionDays: 7,
    defaultMaxRetries: 15,
    parallelExecution: false,
    maxParallel: 1,
    taskTimeout: 1800000 // 30 minutes
  };
}

module.exports = {
  setCwd,
  getDataDir,
  configExists,
  loadConfig,
  saveConfig,
  clearConfigCache,
  getDefaultConfig,
  encrypt,
  decrypt
};
