/**
 * /failed command - Show failed tasks with retry option
 */

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { t } = require('../../i18n');
const { getFailedTasks } = require('../../tasks');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('failed')
    .setDescription(t('commands.failed.description'))
    .addIntegerOption(option =>
      option.setName('limit')
        .setDescription('Number of tasks to show (default: 10)')
        .setMinValue(1)
        .setMaxValue(25)
        .setRequired(false))
    .setDMPermission(true),

  async execute(interaction) {
    const limit = interaction.options.getInteger('limit') || 10;
    const tasks = getFailedTasks(limit);

    if (tasks.length === 0) {
      await interaction.reply({
        content: t('commands.failed.empty')
      });
      return;
    }

    // Create embeds and retry buttons
    const embeds = [];
    const components = [];

    for (const task of tasks.slice(0, 5)) {
      const embed = new EmbedBuilder()
        .setTitle(`❌ ${task.id}`)
        .setColor(0xe74c3c)
        .setTimestamp();

      const requirement = task.requirement.length > 300
        ? task.requirement.substring(0, 300) + '...'
        : task.requirement;

      embed.addFields({
        name: 'Requirement',
        value: requirement,
        inline: false
      });

      const failedAt = task.failedAt
        ? new Date(task.failedAt).toLocaleString()
        : 'Unknown';

      embed.addFields({
        name: 'Failed At',
        value: failedAt,
        inline: true
      });

      embed.addFields({
        name: 'Retries',
        value: `${task.currentRetry}/${task.maxRetries}`,
        inline: true
      });

      if (task.error) {
        const errorText = task.error.length > 500
          ? task.error.substring(0, 500) + '...'
          : task.error;

        embed.addFields({
          name: 'Error',
          value: '```\n' + errorText + '\n```',
          inline: false
        });
      }

      embeds.push(embed);

      // Add retry button
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`retry_task:${task.id}`)
            .setLabel(t('commands.failed.retry'))
            .setStyle(ButtonStyle.Primary)
        );

      components.push(row);
    }

    await interaction.reply({
      embeds: embeds,
      components: components.slice(0, 5)
    });
  }
};
