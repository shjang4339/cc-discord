/**
 * /new command - Create a new task
 */

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { t } = require('../../i18n');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('new')
    .setDescription(t('commands.new.description'))
    .setDMPermission(true),

  async execute(interaction) {
    // Show complexity selection buttons
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('complexity:simple')
          .setLabel(t('commands.new.simple'))
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('complexity:complex')
          .setLabel(t('commands.new.complex'))
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.reply({
      content: t('commands.new.selectComplexity'),
      components: [row]
    });
  }
};
