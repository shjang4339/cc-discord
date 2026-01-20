#!/usr/bin/env node

/**
 * cc-discord CLI entry point
 * Main application that starts the Discord bot and executor
 */

const { needsSetup, runSetup } = require('./init');
const { loadConfig, configExists, setCwd } = require('./config');
const { startBot, stopBot, setSendMessageCallback, sendMessage } = require('./discord/client');
const { startExecutor, stopExecutor } = require('./executor');
const { cleanupOrphanTasks } = require('./tasks');
const { init: initI18n, t } = require('./i18n');

// Version
const packageJson = require('../package.json');
const VERSION = packageJson.version;

// Parse command line arguments
const args = process.argv.slice(2);

// Handle version flag
if (args.includes('--version') || args.includes('-v')) {
  console.log(`cc-discord v${VERSION}`);
  process.exit(0);
}

// Handle help flag
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
cc-discord v${VERSION}

Remote Claude Code execution via Discord

Usage:
  cc-discord              Start the bot
  cc-discord --setup      Run setup wizard
  cc-discord --deploy     Deploy slash commands
  cc-discord --version    Show version
  cc-discord --help       Show this help

Commands (in Discord DM):
  /new          Create a new task
  /list         Show pending tasks
  /status       Show running tasks
  /completed    Show completed tasks
  /failed       Show failed tasks
  /cancel       Cancel a task
  /debug        Show system info
  /reset        Reset all data

GitHub: https://github.com/shjang4339/cc-discord
`);
  process.exit(0);
}

// Handle setup flag
if (args.includes('--setup')) {
  runSetup().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error('Setup failed:', err);
    process.exit(1);
  });
} else if (args.includes('--deploy')) {
  // Deploy commands
  const { deployCommands } = require('./discord/deploy-commands');
  deployCommands().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error('Deploy failed:', err);
    process.exit(1);
  });
} else {
  // Normal startup
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

/**
 * Main application entry point
 */
async function main() {
  console.log(`\n🤖 cc-discord v${VERSION}\n`);

  // Initialize i18n
  initI18n();

  // Check if setup is needed
  if (needsSetup()) {
    console.log('First time setup required.\n');
    await runSetup();

    console.log('\nSetup complete. Please run the following commands:');
    console.log('1. npm run deploy (or: cc-discord --deploy)');
    console.log('2. npm start (or: cc-discord)');
    process.exit(0);
  }

  // Load configuration
  const config = loadConfig();

  if (!config) {
    console.error('Failed to load configuration. Please run setup again.');
    process.exit(1);
  }

  // Set message callback for user registration
  setSendMessageCallback(async (event, data) => {
    if (event === 'userRegistration') {
      // Update config with user ID
      const { saveConfig, loadConfig } = require('./config');
      const currentConfig = loadConfig();
      currentConfig.userId = data.userId;
      saveConfig(currentConfig);

      console.log(`✅ User registered: ${data.username} (${data.userId})`);
    }
  });

  // Cleanup any orphan tasks from previous runs
  const cleaned = cleanupOrphanTasks();
  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} orphan task(s)`);
  }

  // Start Discord bot
  console.log('Starting Discord bot...');

  try {
    await startBot();
    console.log('✅ Discord bot started');
  } catch (err) {
    console.error('❌ Failed to start Discord bot:', err.message);

    if (err.message.includes('TOKEN_INVALID')) {
      console.log('\nYour bot token appears to be invalid.');
      console.log('Please run: cc-discord --setup');
    }

    process.exit(1);
  }

  // Start executor
  startExecutor();
  console.log('✅ Executor started');

  // Check if user ID is registered
  if (!config.userId) {
    console.log('\n⚠️  User ID not registered yet.');
    console.log('Please send /start to your bot via Discord DM.');
  }

  console.log('\n🚀 cc-discord is running!');
  console.log('Press Ctrl+C to stop.\n');

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\nShutting down...');

    await stopExecutor();
    await stopBot();

    console.log('Goodbye! 👋');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await stopExecutor();
    await stopBot();
    process.exit(0);
  });

  // Handle uncaught errors
  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
  });
}
