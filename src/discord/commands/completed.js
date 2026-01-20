/**
 * /completed command - Show completed tasks
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { t } = require('../../i18n');
const { getCompletedTasks } = require('../../tasks');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('completed')
    .setDescription(t('commands.completed.description'))
    .addIntegerOption(option =>
      option.setName('limit')
        .setDescription('Number of tasks to show (default: 10)')
        .setMinValue(1)
        .setMaxValue(25)
        .setRequired(false))
    .setDMPermission(true),

  async execute(interaction) {
    const limit = interaction.options.getInteger('limit') || 10;
    const tasks = getCompletedTasks(limit);

    if (tasks.length === 0) {
      await interaction.reply({
        content: t('commands.completed.empty')
      });
      return;
    }

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(t('commands.completed.title'))
      .setColor(0x2ecc71)
      .setTimestamp();

    for (const task of tasks) {
      const requirement = task.requirement.length > 150
        ? task.requirement.substring(0, 150) + '...'
        : task.requirement;

      const completedAt = task.completedAt
        ? new Date(task.completedAt).toLocaleString()
        : 'Unknown';

      embed.addFields({
        name: `✅ ${task.id}`,
        value: `${requirement}\n*Completed: ${completedAt}*`,
        inline: false
      });
    }

    await interaction.reply({
      embeds: [embed]
    });
  }
};
