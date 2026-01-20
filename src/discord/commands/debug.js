/**
 * /debug command - Show system information
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const os = require('os');
const { t } = require('../../i18n');
const { getAllPendingTasks, getInProgressTasks, getCompletedTasks, getFailedTasks } = require('../../tasks');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('debug')
    .setDescription(t('commands.debug.description'))
    .setDMPermission(true),

  async execute(interaction) {
    // Gather system info
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    // Format uptime
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;

    // Format memory
    const formatBytes = (bytes) => {
      return (bytes / 1024 / 1024).toFixed(2) + ' MB';
    };

    // Task counts
    const pending = getAllPendingTasks().length;
    const inProgress = getInProgressTasks().length;
    const completed = getCompletedTasks(100).length;
    const failed = getFailedTasks(100).length;

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(t('commands.debug.title'))
      .setColor(0x9b59b6)
      .setTimestamp();

    // System info
    embed.addFields({
      name: t('commands.debug.platform'),
      value: `${os.platform()} ${os.release()}`,
      inline: true
    });

    embed.addFields({
      name: t('commands.debug.nodeVersion'),
      value: process.version,
      inline: true
    });

    embed.addFields({
      name: t('commands.debug.uptime'),
      value: uptimeStr,
      inline: true
    });

    // Memory
    embed.addFields({
      name: t('commands.debug.memory'),
      value: [
        `Heap Used: ${formatBytes(memUsage.heapUsed)}`,
        `Heap Total: ${formatBytes(memUsage.heapTotal)}`,
        `RSS: ${formatBytes(memUsage.rss)}`
      ].join('\n'),
      inline: false
    });

    // Task stats
    embed.addFields({
      name: '📊 Task Statistics',
      value: [
        `⏳ Pending: ${pending}`,
        `🔄 In Progress: ${inProgress}`,
        `✅ Completed: ${completed}`,
        `❌ Failed: ${failed}`
      ].join('\n'),
      inline: false
    });

    await interaction.reply({
      embeds: [embed]
    });
  }
};
