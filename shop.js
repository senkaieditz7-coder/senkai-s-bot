const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const { BOXES, getRewardLabel } = require('./boxes');

module.exports = {
  name: 'shop',
  adminOnly: false,
  ownerOnly: false,

  async execute(message, args, client) {
    if (!BOXES) {
      return message.reply("❌ Boxes system not found or broken.");
    }

    const rareRewards = (BOXES.rare?.rewards || [])
      .map(r => `• ${getRewardLabel(client, r)}`)
      .join('\n');

    const premiumRewards = (BOXES.premium?.rewards || []).slice(0, 4)
      .map((r, i) => {
        const chance =
          i === 2 ? ' *(Low Chance)*' :
          i === 3 ? ' *(Very Low Chance)*' : '';
        return `• ${getRewardLabel(client, r)}${chance}`;
      })
      .join('\n');

    const luxuryRewards = (BOXES.luxury?.rewards || []).slice(0, 4)
      .map((r) => `• ${getRewardLabel(client, r)} *(Rare)*`)
      .join('\n');

    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle('🎁 Mystery Box Shop')
      .setDescription(
        'Choose a box to open! Coins are deducted instantly when buying.'
      )
      .addFields(
        {
          name: `${BOXES.rare?.emoji || '🟦'} Rare Box — **${BOXES.rare?.cost || 0} coins**`,
          value: rareRewards || 'No rewards set',
        },
        {
          name: `${BOXES.premium?.emoji || '🟪'} Premium Box — **${BOXES.premium?.cost || 0} coins**`,
          value: premiumRewards || 'No rewards set',
        },
        {
          name: `${BOXES.luxury?.emoji || '🟨'} Luxury Box — **${BOXES.luxury?.cost || 0} coins**`,
          value: luxuryRewards || 'No rewards set',
        }
      )
      .setFooter({ text: 'Earn coins with £daily and chatting!' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('buy_rare')
        .setLabel(`🟦 Rare (${BOXES.rare?.cost || 0})`)
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId('buy_premium')
        .setLabel(`🟪 Premium (${BOXES.premium?.cost || 0})`)
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId('buy_luxury')
        .setLabel(`🟨 Luxury (${BOXES.luxury?.cost || 0})`)
        .setStyle(ButtonStyle.Success)
    );

    return message.reply({ embeds: [embed], components: [row] });
  },
};
