/**
 * cc-discord - Remote Claude Code execution via Discord
 *
 * Public API exports
 */

// Discord client
const {
  startBot,
  stopBot,
  sendMessage,
  getClient,
  getCommands
} = require('./discord/client');

// Executor
const {
  startExecutor,
  stopExecutor,
  isExecutorRunning,
  getRunningTasks,
  cancelRunningTask
} = require('./executor');

// Tasks
const {
  createTask,
  getAllPendingTasks,
  getCompletedTasks,
  getFailedTasks,
  cancelTask,
  PRIORITY,
  STATUS
} = require('./tasks');

// Config
const {
  loadConfig,
  saveConfig,
  configExists
} = require('./config');

// Setup
const {
  runSetup,
  needsSetup
} = require('./init');

// i18n
const {
  t,
  init: initI18n,
  setLang,
  getCurrentLang
} = require('./i18n');

module.exports = {
  // Discord
  startBot,
  stopBot,
  sendMessage,
  getClient,
  getCommands,

  // Executor
  startExecutor,
  stopExecutor,
  isExecutorRunning,
  getRunningTasks,
  cancelRunningTask,

  // Tasks
  createTask,
  getAllPendingTasks,
  getCompletedTasks,
  getFailedTasks,
  cancelTask,
  PRIORITY,
  STATUS,

  // Config
  loadConfig,
  saveConfig,
  configExists,

  // Setup
  runSetup,
  needsSetup,

  // i18n
  t,
  initI18n,
  setLang,
  getCurrentLang
};
