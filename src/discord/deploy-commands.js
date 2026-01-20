#!/usr/bin/env node

/**
 * Deploy slash commands to Discord
 * Run this script after changing commands: npm run deploy
 */

const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { loadConfig, configExists } = require('../config');

async function deployCommands() {
  // Check if config exists
  if (!configExists()) {
    console.error('❌ Configuration not found. Run cc-discord first to set up.');
    process.exit(1);
  }

  const config = loadConfig();

  if (!config || !config.botToken || !config.clientId) {
    console.error('❌ Bot token or Client ID not configured.');
    process.exit(1);
  }

  // Load commands
  const commands = [];
  const commandsPath = path.join(__dirname, 'commands');

  if (!fs.existsSync(commandsPath)) {
    console.error('❌ Commands directory not found.');
    process.exit(1);
  }

  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
      console.log(`📝 Loaded command: ${command.data.name}`);
    } else {
      console.warn(`⚠️  Command ${file} is missing 'data' or 'execute' property`);
    }
  }

  // Create REST client
  const rest = new REST({ version: '10' }).setToken(config.botToken);

  try {
    console.log(`\n🔄 Deploying ${commands.length} commands...`);

    // Deploy globally (takes up to 1 hour to propagate)
    const data = await rest.put(
      Routes.applicationCommands(config.clientId),
      { body: commands }
    );

    console.log(`✅ Successfully deployed ${data.length} commands!`);
    console.log('\n📌 Note: Global commands may take up to 1 hour to appear in Discord.');
    console.log('   For instant testing, use guild-specific commands instead.');
  } catch (error) {
    console.error('❌ Failed to deploy commands:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  deployCommands();
}

module.exports = { deployCommands };
