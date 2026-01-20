/**
 * Discord client setup and management for cc-discord
 * Handles bot initialization, event registration, and message handling
 */

const { Client, GatewayIntentBits, Partials, Collection, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { loadConfig } = require('../config');
const { t } = require('../i18n');

// Discord client instance
let client = null;

// Command collection
const commands = new Collection();

// Store for Claude output (taskId -> last 20 lines)
const claudeOutputs = new Map();

// Callback for sending messages (set by executor)
let sendMessageCallback = null;

/**
 * Initialize the Discord client
 */
function createClient() {
  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.DirectMessageReactions,
      GatewayIntentBits.MessageContent
    ],
    partials: [
      Partials.Channel, // Required to receive DMs
      Partials.Message
    ]
  });

  // Load commands
  loadCommands();

  // Register event handlers
  registerEvents();

  return client;
}

/**
 * Load all command files
 */
function loadCommands() {
  const commandsPath = path.join(__dirname, 'commands');

  if (!fs.existsSync(commandsPath)) {
    console.warn('Commands directory not found:', commandsPath);
    return;
  }

  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
      commands.set(command.data.name, command);
    } else {
      console.warn(`Command ${file} is missing 'data' or 'execute' property`);
    }
  }
}

/**
 * Register Discord event handlers
 */
function registerEvents() {
  // Ready event
  client.once(Events.ClientReady, (readyClient) => {
    console.log(`✅ Discord bot ready! Logged in as ${readyClient.user.tag}`);
  });

  // Interaction (slash command) event
  client.on(Events.InteractionCreate, async (interaction) => {
    // Check if DM only mode
    if (!interaction.channel.isDMBased()) {
      // For now, we only support DM
      if (interaction.isCommand()) {
        await interaction.reply({
          content: t('errors.notInDM'),
          ephemeral: true
        });
      }
      return;
    }

    // Check authorization
    const config = loadConfig();
    if (config && config.userId && interaction.user.id !== config.userId) {
      if (interaction.isCommand()) {
        await interaction.reply({
          content: t('errors.notAuthorized'),
          ephemeral: true
        });
      }
      return;
    }

    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = commands.get(interaction.commandName);

      if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`Error executing ${interaction.commandName}:`, error);

        const errorMessage = {
          content: t('errors.unknownError'),
          ephemeral: true
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      }
    }

    // Handle button interactions
    if (interaction.isButton()) {
      await handleButtonInteraction(interaction);
    }

    // Handle select menu interactions
    if (interaction.isStringSelectMenu()) {
      await handleSelectMenuInteraction(interaction);
    }

    // Handle modal submissions
    if (interaction.isModalSubmit()) {
      await handleModalSubmit(interaction);
    }
  });

  // Direct message event (for initial setup)
  client.on(Events.MessageCreate, async (message) => {
    // Ignore bot messages
    if (message.author.bot) return;

    // Only handle DMs
    if (!message.channel.isDMBased()) return;

    // Handle /start command for initial registration
    if (message.content.toLowerCase() === '/start') {
      const config = loadConfig();

      if (!config || !config.userId) {
        // This is initial setup - save user ID
        if (sendMessageCallback) {
          sendMessageCallback('userRegistration', {
            userId: message.author.id,
            username: message.author.username
          });
        }

        await message.reply(t('init.userIdReceived', { userId: message.author.id }));
      } else if (config.userId === message.author.id) {
        await message.reply('✅ You are already registered.');
      } else {
        await message.reply(t('errors.notAuthorized'));
      }
    }
  });
}

/**
 * Handle button interactions
 */
async function handleButtonInteraction(interaction) {
  const [action, ...params] = interaction.customId.split(':');

  switch (action) {
    case 'cancel_task': {
      const taskId = params[0];
      const { cancelTask } = require('../tasks');
      const success = cancelTask(taskId);

      if (success) {
        await interaction.update({
          content: t('commands.cancel.success', { taskId }),
          components: []
        });
      } else {
        await interaction.update({
          content: t('commands.cancel.notFound'),
          components: []
        });
      }
      break;
    }

    case 'reset_confirm': {
      // Actually reset data
      const { getDataDir } = require('../config');
      const dataDir = getDataDir();

      // Clear task files
      const folders = ['tasks', 'completed', 'failed'];
      for (const folder of folders) {
        const folderPath = path.join(dataDir, folder);
        if (fs.existsSync(folderPath)) {
          const files = fs.readdirSync(folderPath);
          for (const file of files) {
            fs.unlinkSync(path.join(folderPath, file));
          }
        }
      }

      // Clear index files
      const indexFiles = ['tasks.json', 'completed.json', 'failed.json'];
      for (const indexFile of indexFiles) {
        const indexPath = path.join(dataDir, indexFile);
        if (fs.existsSync(indexPath)) {
          fs.writeFileSync(indexPath, '[]');
        }
      }

      await interaction.update({
        content: t('commands.reset.success'),
        components: []
      });
      break;
    }

    case 'reset_cancel': {
      await interaction.update({
        content: t('commands.reset.cancelled'),
        components: []
      });
      break;
    }

    case 'complexity': {
      const complexity = params[0];

      // Store complexity in interaction state and show priority selection
      const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

      const prioritySelect = new ActionRowBuilder()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`priority:${complexity}`)
            .setPlaceholder(t('commands.new.selectPriority'))
            .addOptions([
              { label: t('commands.new.priorityUrgent'), value: 'urgent', emoji: '🔴' },
              { label: t('commands.new.priorityHigh'), value: 'high', emoji: '🟠' },
              { label: t('commands.new.priorityNormal'), value: 'normal', emoji: '🟢' },
              { label: t('commands.new.priorityLow'), value: 'low', emoji: '🔵' }
            ])
        );

      await interaction.update({
        content: t('commands.new.selectPriority'),
        components: [prioritySelect]
      });
      break;
    }

    case 'retry_task': {
      const taskId = params[0];
      // Re-queue the failed task
      const { getTaskById, createTask, PRIORITY } = require('../tasks');
      const oldTask = getTaskById(taskId);

      if (oldTask) {
        const newTask = createTask({
          requirement: oldTask.requirement,
          completionCriteria: oldTask.completionCriteria,
          maxRetries: oldTask.maxRetries,
          priority: oldTask.priority,
          complexity: oldTask.complexity,
          attachments: oldTask.attachments || []
        });

        await interaction.update({
          content: t('commands.new.created', { taskId: newTask.id }),
          components: []
        });
      } else {
        await interaction.update({
          content: t('commands.cancel.notFound'),
          components: []
        });
      }
      break;
    }

    default:
      console.warn('Unknown button action:', action);
  }
}

/**
 * Handle select menu interactions
 */
async function handleSelectMenuInteraction(interaction) {
  const [action, ...params] = interaction.customId.split(':');

  switch (action) {
    case 'priority': {
      const complexity = params[0];
      const priority = interaction.values[0];

      const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

      // Show modal for task details
      const modal = new ModalBuilder()
        .setCustomId(`new_task:${complexity}:${priority}`)
        .setTitle(t('commands.new.name'));

      const requirementInput = new TextInputBuilder()
        .setCustomId('requirement')
        .setLabel(t('commands.new.requirementLabel'))
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder(t('commands.new.requirementPlaceholder'))
        .setRequired(true)
        .setMaxLength(2000);

      const criteriaInput = new TextInputBuilder()
        .setCustomId('criteria')
        .setLabel(t('commands.new.criteriaLabel'))
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder(t('commands.new.criteriaPlaceholder'))
        .setRequired(false)
        .setMaxLength(1000);

      modal.addComponents(
        new ActionRowBuilder().addComponents(requirementInput),
        new ActionRowBuilder().addComponents(criteriaInput)
      );

      await interaction.showModal(modal);
      break;
    }

    default:
      console.warn('Unknown select menu action:', action);
  }
}

/**
 * Handle modal submissions
 */
async function handleModalSubmit(interaction) {
  const [action, ...params] = interaction.customId.split(':');

  switch (action) {
    case 'new_task': {
      const complexity = params[0];
      const priorityStr = params[1];

      const requirement = interaction.fields.getTextInputValue('requirement');
      const criteria = interaction.fields.getTextInputValue('criteria') || null;

      const { createTask, PRIORITY } = require('../tasks');
      const { loadConfig } = require('../config');

      const config = loadConfig();

      // Map priority string to PRIORITY constant
      const priorityMap = {
        'urgent': PRIORITY.URGENT,
        'high': PRIORITY.HIGH,
        'normal': PRIORITY.NORMAL,
        'low': PRIORITY.LOW
      };

      const task = createTask({
        requirement,
        completionCriteria: criteria,
        maxRetries: complexity === 'complex' ? (config?.defaultMaxRetries || 15) : 1,
        priority: priorityMap[priorityStr] || PRIORITY.NORMAL,
        complexity
      });

      await interaction.reply({
        content: t('commands.new.created', { taskId: task.id })
      });
      break;
    }

    case 'quick_task': {
      // Quick task creation (simple, normal priority)
      const requirement = interaction.fields.getTextInputValue('requirement');

      const { createTask, PRIORITY } = require('../tasks');

      const task = createTask({
        requirement,
        completionCriteria: null,
        maxRetries: 1,
        priority: PRIORITY.NORMAL,
        complexity: 'simple'
      });

      await interaction.reply({
        content: t('commands.new.created', { taskId: task.id })
      });
      break;
    }

    default:
      console.warn('Unknown modal action:', action);
  }
}

/**
 * Start the Discord bot
 */
async function startBot() {
  const config = loadConfig();

  if (!config || !config.botToken) {
    throw new Error('Bot token not configured. Run setup first.');
  }

  if (!client) {
    createClient();
  }

  await client.login(config.botToken);
  return client;
}

/**
 * Stop the Discord bot
 */
async function stopBot() {
  if (client) {
    await client.destroy();
    client = null;
  }
}

/**
 * Send a message to the registered user
 */
async function sendMessage(content, options = {}) {
  const config = loadConfig();

  if (!config || !config.userId) {
    console.error('User ID not configured');
    return null;
  }

  try {
    const user = await client.users.fetch(config.userId);
    const dm = await user.createDM();

    // Handle long messages
    if (content.length > 2000) {
      const chunks = splitMessage(content);
      for (const chunk of chunks) {
        await dm.send({ content: chunk, ...options });
        await new Promise(r => setTimeout(r, 100)); // Rate limit prevention
      }
      return true;
    }

    return await dm.send({ content, ...options });
  } catch (error) {
    console.error('Failed to send message:', error);
    return null;
  }
}

/**
 * Split a long message into chunks
 */
function splitMessage(text, maxLength = 1900) {
  if (text.length <= maxLength) return [text];

  const chunks = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    // Find a good split point
    let splitIndex = remaining.lastIndexOf('\n', maxLength);
    if (splitIndex === -1 || splitIndex < maxLength / 2) {
      splitIndex = remaining.lastIndexOf(' ', maxLength);
    }
    if (splitIndex === -1) {
      splitIndex = maxLength;
    }

    chunks.push(remaining.substring(0, splitIndex));
    remaining = remaining.substring(splitIndex).trim();
  }

  return chunks;
}

/**
 * Update Claude output for a task
 */
function updateClaudeOutput(taskId, output) {
  const lines = claudeOutputs.get(taskId) || [];
  const newLines = output.split('\n');

  for (const line of newLines) {
    if (line.trim()) {
      lines.push(line);
      if (lines.length > 20) {
        lines.shift();
      }
    }
  }

  claudeOutputs.set(taskId, lines);
}

/**
 * Get recent Claude output for a task
 */
function getClaudeOutput(taskId) {
  return claudeOutputs.get(taskId) || [];
}

/**
 * Clear Claude output for a task
 */
function clearClaudeOutput(taskId) {
  claudeOutputs.delete(taskId);
}

/**
 * Set callback for sending messages from executor
 */
function setSendMessageCallback(callback) {
  sendMessageCallback = callback;
}

/**
 * Get the Discord client instance
 */
function getClient() {
  return client;
}

/**
 * Get all loaded commands
 */
function getCommands() {
  return commands;
}

module.exports = {
  createClient,
  startBot,
  stopBot,
  sendMessage,
  splitMessage,
  updateClaudeOutput,
  getClaudeOutput,
  clearClaudeOutput,
  setSendMessageCallback,
  getClient,
  getCommands
};
