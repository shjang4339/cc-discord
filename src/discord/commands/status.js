/**
 * /status command - Show running tasks and recent output
 */

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { t } = require('../../i18n');
const { getInProgressTasks, PRIORITY_LABELS } = require('../../tasks');
const { getClaudeOutput } = require('../client');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription(t('commands.status.description'))
    .setDMPermission(true),

  async execute(interaction) {
    const tasks = getInProgressTasks();

    if (tasks.length === 0) {
      await interaction.reply({
        content: t('commands.status.empty')
      });
      return;
    }

    // Create embed for each running task
    const embeds = [];
    const components = [];

    for (const task of tasks.slice(0, 5)) {
      const embed = new EmbedBuilder()
        .setTitle(`🔄 ${task.id}`)
        .setColor(0xf39c12)
        .setTimestamp();

      // Task info
      const requirement = task.requirement.length > 500
        ? task.requirement.substring(0, 500) + '...'
        : task.requirement;

      embed.addFields({
        name: 'Requirement',
        value: requirement,
        inline: false
      });

      embed.addFields({
        name: 'Started',
        value: task.startedAt ? new Date(task.startedAt).toLocaleString() : 'Unknown',
        inline: true
      });

      embed.addFields({
        name: 'Retry',
        value: `${task.currentRetry}/${task.maxRetries}`,
        inline: true
      });

      // Get recent Claude output
      const output = getClaudeOutput(task.id);
      if (output.length > 0) {
        const outputText = output.slice(-10).join('\n');
        const truncatedOutput = outputText.length > 1000
          ? '...' + outputText.substring(outputText.length - 1000)
          : outputText;

        embed.addFields({
          name: t('commands.status.recentOutput'),
          value: '```\n' + truncatedOutput + '\n```',
          inline: false
        });
      }

      embeds.push(embed);

      // Add cancel button for each task
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`cancel_task:${task.id}`)
            .setLabel(t('commands.status.cancel'))
            .setStyle(ButtonStyle.Danger)
        );

      components.push(row);
    }

    await interaction.reply({
      embeds: embeds,
      components: components.slice(0, 5) // Max 5 action rows
    });
  }
};
