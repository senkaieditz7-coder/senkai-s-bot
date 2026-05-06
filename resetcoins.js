const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

module.exports = {
  name: 'resetcoins',
  adminOnly: false,
  ownerOnly: true,
  async execute(message) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('resetcoins_confirm')
        .setLabel('Yes, reset all coins')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('resetcoins_cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary)
    );

    await message.reply({
      content: '⚠️ **Are you sure?** This will set **all users\' coins to 0**. This cannot be undone.',
      components: [row],
    });
  },
};
