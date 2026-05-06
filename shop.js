const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { BOXES, getRewardLabel } = require('../boxes');

module.exports = {
  name: 'shop',
  adminOnly: false,
  ownerOnly: false,
  async execute(message, args, client) {
    const rareRewards = BOXES.rare.rewards
      .map(r => `• ${getRewardLabel(client, r)}`).join('\n');

    const premiumRewards = [
      `• ${getRewardLabel(client, BOXES.premium.rewards[0])}`,
      `• ${getRewardLabel(client, BOXES.premium.rewards[1])}`,
      `• ${getRewardLabel(client, BOXES.premium.rewards[2])} *(Low Chance)*`,
      `• ${getRewardLabel(client, BOXES.premium.rewards[3])} *(Very Low Chance)*`,
    ].join('\n');

    const luxuryRewards = [
      `• ${getRewardLabel(client, BOXES.luxury.rewards[0])} *(Low Chance)*`,
      `• ${getRewardLabel(client, BOXES.luxury.rewards[1])} *(Low Chance)*`,
      `• ${getRewardLabel(client, BOXES.luxury.rewards[2])} *(Very Low Chance)*`,
      `• ${getRewardLabel(client, BOXES.luxury.rewards[3])} *(Very Low Chance)*`,
    ].join('\n');

    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle('🎁 Mystery Box Shop')
      .setDescription('Choose a box to open! Each box contains random Devil Fruits.\nCoins are deducted immediately upon purchase.')
      .addFields(
        { name: `${BOXES.rare.emoji} Rare Box — **${BOXES.rare.cost} coins**`, value: rareRewards },
        { name: `${BOXES.premium.emoji} Premium Box — **${BOXES.premium.cost} coins**`, value: premiumRewards },
        { name: `${BOXES.luxury.emoji} Luxury Box — **${BOXES.luxury.cost} coins**`, value: luxuryRewards }
      )
      .setFooter({ text: 'Earn coins with £daily and by chatting!' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('buy_rare')
        .setLabel(`🟦 Rare Box (${BOXES.rare.cost} 🪙)`)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('buy_premium')
        .setLabel(`🟪 Premium Box (${BOXES.premium.cost} 🪙)`)
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('buy_luxury')
        .setLabel(`🟨 Luxury Box (${BOXES.luxury.cost} 🪙)`)
        .setStyle(ButtonStyle.Success)
    );

    await message.reply({ embeds: [embed], components: [row] });
  },
};
