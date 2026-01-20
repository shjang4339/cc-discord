/**
 * Interactive setup wizard for cc-discord
 * Guides user through initial configuration
 */

const readline = require('readline');
const { saveConfig, getDefaultConfig, getDataDir } = require('./config');
const { t, init: initI18n } = require('./i18n');

// Create readline interface
function createReadline() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

// Prompt user for input
function prompt(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Validate Discord bot token format
function isValidToken(token) {
  // Discord tokens have a specific format
  return token && token.length > 50 && token.includes('.');
}

// Validate Discord ID format
function isValidDiscordId(id) {
  return /^\d{17,19}$/.test(id);
}

/**
 * Run the setup wizard
 */
async function runSetup() {
  const rl = createReadline();

  console.log('\n' + '='.repeat(50));
  console.log('  cc-discord Setup Wizard');
  console.log('='.repeat(50) + '\n');

  console.log(t('init.welcome'));
  console.log('\nBefore starting, you need to:');
  console.log('1. Go to https://discord.com/developers/applications');
  console.log('2. Create a new application');
  console.log('3. Go to "Bot" section and create a bot');
  console.log('4. Copy the bot token');
  console.log('5. Go to "OAuth2 > URL Generator"');
  console.log('   - Select scopes: bot, applications.commands');
  console.log('   - Select permissions: Send Messages, Embed Links, Attach Files, Use Slash Commands');
  console.log('6. Use the generated URL to invite the bot to a server (for testing)');
  console.log('');

  // Get bot token
  let botToken = '';
  while (!isValidToken(botToken)) {
    botToken = await prompt(rl, t('init.tokenPrompt') + ' ');
    if (!isValidToken(botToken)) {
      console.log(t('init.tokenInvalid'));
    }
  }

  // Get client ID
  console.log('\nYou can find the Application (Client) ID on the application\'s General Information page.');
  let clientId = '';
  while (!isValidDiscordId(clientId)) {
    clientId = await prompt(rl, t('init.clientIdPrompt') + ' ');
    if (!isValidDiscordId(clientId)) {
      console.log('Invalid Client ID format. Should be a 17-19 digit number.');
    }
  }

  // Get default max retries
  const retriesInput = await prompt(rl, t('init.retriesPrompt') + ' ');
  const defaultMaxRetries = parseInt(retriesInput) || 15;

  // Parallel execution
  const parallelInput = await prompt(rl, t('init.parallelPrompt') + ' ');
  const parallelExecution = parallelInput.toLowerCase() === 'y';

  let maxParallel = 1;
  if (parallelExecution) {
    const maxParallelInput = await prompt(rl, t('init.maxParallelPrompt') + ' ');
    maxParallel = parseInt(maxParallelInput) || 1;
    maxParallel = Math.max(1, Math.min(maxParallel, 10)); // Limit 1-10
  }

  // Save configuration
  const config = {
    ...getDefaultConfig(),
    botToken,
    clientId,
    userId: null, // Will be set when user sends /start
    defaultMaxRetries,
    parallelExecution,
    maxParallel
  };

  saveConfig(config);

  console.log('\n' + '='.repeat(50));
  console.log('  Configuration saved!');
  console.log('='.repeat(50));
  console.log('\nNext steps:');
  console.log('1. Run: npm run deploy');
  console.log('   This will register slash commands with Discord.');
  console.log('');
  console.log('2. Start the bot: npm start');
  console.log('');
  console.log('3. Send a DM to your bot with /start');
  console.log('   This will register your user ID.');
  console.log('');
  console.log(`Config location: ${getDataDir()}`);
  console.log('');

  rl.close();
  return config;
}

/**
 * Check if setup is needed
 */
function needsSetup() {
  const { configExists, loadConfig } = require('./config');

  if (!configExists()) {
    return true;
  }

  const config = loadConfig();
  return !config || !config.botToken || !config.clientId;
}

module.exports = {
  runSetup,
  needsSetup
};
