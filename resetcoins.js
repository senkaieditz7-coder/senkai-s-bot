const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const { OWNER_ID } = require('./variables');

module.exports = {
  name: 'resetcoins',
  adminOnly: false,
  ownerOnly: true,

  async execute(message) {
    if (message.author.id !== OWNER_ID) {
      return message.reply('❌ Owner only command.');
    }

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

    return message.reply({
      content: '⚠️ Are you sure you want to reset ALL coins?',
      components: [row],
    });
  },
};
