/**
 * Internationalization support for cc-discord
 * Supports Korean and English with system language detection
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Default English translations (fallback)
const defaultTranslations = {
  app: {
    name: 'cc-discord',
    description: 'Remote Claude Code execution via Discord'
  },
  init: {
    welcome: 'Welcome to cc-discord setup!',
    tokenPrompt: 'Please enter your Discord Bot Token:',
    tokenInvalid: 'Invalid token. Please check and try again.',
    clientIdPrompt: 'Please enter your Application (Client) ID:',
    userIdPrompt: 'Please DM the bot with /start to register your User ID.',
    userIdReceived: 'User ID registered: {userId}',
    setupComplete: 'Setup complete! You can now use cc-discord.',
    retriesPrompt: 'Enter default max retries (default: 15):',
    parallelPrompt: 'Enable parallel execution? (y/n):',
    maxParallelPrompt: 'Enter max parallel tasks (default: 1):'
  },
  commands: {
    new: {
      name: 'new',
      description: 'Create a new task',
      requirementLabel: 'Requirement',
      requirementPlaceholder: 'Enter task requirement...',
      criteriaLabel: 'Completion Criteria (optional)',
      criteriaPlaceholder: 'Enter completion criteria...',
      created: '✅ Task created: {taskId}',
      selectComplexity: 'Select task complexity:',
      simple: 'Simple (single execution)',
      complex: 'Complex (with retry)',
      selectPriority: 'Select priority:',
      priorityUrgent: '🔴 Urgent',
      priorityHigh: '🟠 High',
      priorityNormal: '🟢 Normal',
      priorityLow: '🔵 Low'
    },
    list: {
      name: 'list',
      description: 'Show pending tasks',
      title: '📋 Pending Tasks',
      empty: 'No pending tasks.',
      taskFormat: '**{id}** ({priority})\n{requirement}'
    },
    status: {
      name: 'status',
      description: 'Show running tasks',
      title: '🔄 Running Tasks',
      empty: 'No running tasks.',
      taskFormat: '**{id}** - Started: {startedAt}\n{requirement}',
      recentOutput: 'Recent output:',
      cancel: 'Cancel'
    },
    completed: {
      name: 'completed',
      description: 'Show completed tasks',
      title: '✅ Completed Tasks',
      empty: 'No completed tasks.',
      taskFormat: '**{id}** - Completed: {completedAt}\n{requirement}'
    },
    failed: {
      name: 'failed',
      description: 'Show failed tasks',
      title: '❌ Failed Tasks',
      empty: 'No failed tasks.',
      taskFormat: '**{id}** - Failed: {failedAt}\n{requirement}',
      retry: 'Retry'
    },
    debug: {
      name: 'debug',
      description: 'Show system information',
      title: '🔧 Debug Information',
      memory: 'Memory Usage',
      uptime: 'Uptime',
      platform: 'Platform',
      nodeVersion: 'Node.js Version'
    },
    reset: {
      name: 'reset',
      description: 'Reset all data',
      confirm: '⚠️ Are you sure you want to reset all data? This cannot be undone.',
      confirmButton: 'Yes, Reset',
      cancelButton: 'Cancel',
      success: '✅ All data has been reset.',
      cancelled: 'Reset cancelled.'
    },
    cancel: {
      name: 'cancel',
      description: 'Cancel a task',
      selectTask: 'Select a task to cancel:',
      success: '✅ Task {taskId} cancelled.',
      notFound: 'Task not found.',
      noTasks: 'No tasks to cancel.'
    }
  },
  executor: {
    starting: '🚀 Starting task: {taskId}',
    completed: '✅ Task completed: {taskId}',
    failed: '❌ Task failed: {taskId}',
    retrying: '🔄 Retrying task: {taskId} (Attempt {current}/{max})',
    timeout: '⏱️ Task timed out: {taskId}',
    output: '📝 Output from {taskId}:'
  },
  errors: {
    notAuthorized: '⛔ You are not authorized to use this bot.',
    notInDM: 'This command can only be used in DM.',
    unknownError: 'An unknown error occurred.'
  }
};

// Current language
let currentLang = 'en';
let translations = defaultTranslations;

/**
 * Detect system language
 */
function detectSystemLanguage() {
  try {
    const platform = process.platform;

    if (platform === 'win32') {
      // Windows: Use PowerShell to get UI culture
      const result = execSync(
        'powershell -command "[System.Globalization.CultureInfo]::CurrentUICulture.Name"',
        { encoding: 'utf8', timeout: 5000 }
      ).trim();
      return result.split('-')[0].toLowerCase();
    } else if (platform === 'darwin') {
      // macOS: Read AppleLocale
      const result = execSync(
        'defaults read -g AppleLocale',
        { encoding: 'utf8', timeout: 5000 }
      ).trim();
      return result.split('_')[0].toLowerCase();
    } else {
      // Linux/others: Check environment variables
      const lang = process.env.LANG || process.env.LANGUAGE || process.env.LC_ALL || 'en';
      return lang.split('_')[0].split('.')[0].toLowerCase();
    }
  } catch (e) {
    return 'en';
  }
}

/**
 * Load translations for a specific language
 */
function loadTranslations(lang) {
  const localesDir = path.join(__dirname, 'locales');
  const langFile = path.join(localesDir, `${lang}.json`);

  if (fs.existsSync(langFile)) {
    try {
      const data = fs.readFileSync(langFile, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      return defaultTranslations;
    }
  }

  return defaultTranslations;
}

/**
 * Initialize i18n with detected or specified language
 */
function init(lang = null) {
  currentLang = lang || detectSystemLanguage();

  // Supported languages
  const supported = ['ko', 'en', 'zh', 'es', 'hi', 'ar', 'pt', 'ru', 'ja', 'fr', 'de'];
  if (!supported.includes(currentLang)) {
    currentLang = 'en';
  }

  translations = loadTranslations(currentLang);
}

/**
 * Get translation by dot-notation key
 * @param {string} key - Dot-notation key (e.g., 'commands.new.name')
 * @param {object} params - Parameters to replace in the translation
 */
function t(key, params = {}) {
  const keys = key.split('.');
  let value = translations;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback to default translations
      value = defaultTranslations;
      for (const k2 of keys) {
        if (value && typeof value === 'object' && k2 in value) {
          value = value[k2];
        } else {
          return key; // Return key if not found
        }
      }
      break;
    }
  }

  if (typeof value !== 'string') {
    return key;
  }

  // Replace parameters
  return value.replace(/\{(\w+)\}/g, (match, param) => {
    return params[param] !== undefined ? params[param] : match;
  });
}

/**
 * Get current language
 */
function getCurrentLang() {
  return currentLang;
}

/**
 * Set language manually
 */
function setLang(lang) {
  currentLang = lang;
  translations = loadTranslations(lang);
}

// Initialize with system language
init();

module.exports = {
  init,
  t,
  getCurrentLang,
  setLang
};
