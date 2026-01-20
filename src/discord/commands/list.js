/**
 * /list command - Show pending tasks
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { t } = require('../../i18n');
const { getAllPendingTasks, PRIORITY_LABELS } = require('../../tasks');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('list')
    .setDescription(t('commands.list.description'))
    .setDMPermission(true),

  async execute(interaction) {
    const tasks = getAllPendingTasks();

    if (tasks.length === 0) {
      await interaction.reply({
        content: t('commands.list.empty')
      });
      return;
    }

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(t('commands.list.title'))
      .setColor(0x3498db)
      .setTimestamp();

    // Add tasks to embed (max 25 fields)
    const displayTasks = tasks.slice(0, 10);

    for (const task of displayTasks) {
      const priorityLabel = PRIORITY_LABELS[task.priority] || '🟢 Normal';
      const requirement = task.requirement.length > 200
        ? task.requirement.substring(0, 200) + '...'
        : task.requirement;

      embed.addFields({
        name: `${task.id} (${priorityLabel})`,
        value: requirement,
        inline: false
      });
    }

    if (tasks.length > 10) {
      embed.setFooter({
        text: `... and ${tasks.length - 10} more tasks`
      });
    }

    await interaction.reply({
      embeds: [embed]
    });
  }
};
