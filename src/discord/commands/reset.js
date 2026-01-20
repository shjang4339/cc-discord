/**
 * /reset command - Reset all data with confirmation
 */

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { t } = require('../../i18n');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reset')
    .setDescription(t('commands.reset.description'))
    .setDMPermission(true),

  async execute(interaction) {
    // Show confirmation buttons
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('reset_confirm')
          .setLabel(t('commands.reset.confirmButton'))
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('reset_cancel')
          .setLabel(t('commands.reset.cancelButton'))
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.reply({
      content: t('commands.reset.confirm'),
      components: [row]
    });
  }
};
