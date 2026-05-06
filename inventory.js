const { EmbedBuilder } = require('discord.js');
const db = require('../database');

module.exports = {
  name: 'inventory',
  adminOnly: false,
  ownerOnly: false,
  async execute(message) {
    const userId = message.author.id;
    const items = db.getInventory(userId);

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle('🎒 Inventory')
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp();

    if (items.length === 0) {
      embed.setDescription("You don't have any items yet!\nOpen mystery boxes with `£shop` to get items.");
    } else {
      embed.setDescription(items.map(i => `• **${i.item_name}** x${i.quantity}`).join('\n'));
    }

    embed.setFooter({ text: `${message.author.username}'s inventory` });
    await message.reply({ embeds: [embed] });
  },
};
