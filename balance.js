const { EmbedBuilder } = require('discord.js');
const db = require('../database');

module.exports = {
  name: 'balance',
  adminOnly: false,
  ownerOnly: false,
  async execute(message, args) {
    let target = message.mentions.users.first() || message.author;

    const coins = db.getBalance(target.id);

    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle('💰 Wallet')
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .addFields({ name: target.username, value: `**${coins.toLocaleString()}** coins` })
      .setFooter({ text: 'Earn coins with £daily or by chatting' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
