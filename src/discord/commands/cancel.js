/**
 * /cancel command - Cancel a pending or running task
 */

const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { t } = require('../../i18n');
const { getAllPendingTasks, getInProgressTasks, cancelTask } = require('../../tasks');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cancel')
    .setDescription(t('commands.cancel.description'))
    .addStringOption(option =>
      option.setName('task_id')
        .setDescription('Task ID to cancel (optional)')
        .setRequired(false))
    .setDMPermission(true),

  async execute(interaction) {
    const taskId = interaction.options.getString('task_id');

    // If task ID provided directly, cancel it
    if (taskId) {
      const success = cancelTask(taskId);

      if (success) {
        await interaction.reply({
          content: t('commands.cancel.success', { taskId })
        });
      } else {
        await interaction.reply({
          content: t('commands.cancel.notFound')
        });
      }
      return;
    }

    // Otherwise, show task selection
    const pendingTasks = getAllPendingTasks();
    const inProgressTasks = getInProgressTasks();
    const allTasks = [...pendingTasks, ...inProgressTasks];

    if (allTasks.length === 0) {
      await interaction.reply({
        content: t('commands.cancel.noTasks')
      });
      return;
    }

    // Create select menu with tasks
    const options = allTasks.slice(0, 25).map(task => {
      const label = task.id;
      const description = task.requirement.length > 100
        ? task.requirement.substring(0, 97) + '...'
        : task.requirement;

      return {
        label,
        description,
        value: task.id
      };
    });

    const row = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('cancel_select')
          .setPlaceholder(t('commands.cancel.selectTask'))
          .addOptions(options)
      );

    await interaction.reply({
      content: t('commands.cancel.selectTask'),
      components: [row]
    });
  }
};
