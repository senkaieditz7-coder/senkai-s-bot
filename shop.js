const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const { BOXES } = require('./boxes');

module.exports = {
  name: 'shop',

  async execute(message) {
    const rareRewards = BOXES.rare.rewards
      .map(r => `• ${r.name}`)
      .join('\n');

    const premiumRewards = BOXES.premium.rewards
      .map(r => `• ${r.name}`)
      .join('\n');

    const luxuryRewards = BOXES.luxury.rewards
      .map(r => `• ${r.name}`)
      .join('\n');

    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle('🎁 Mystery Box Shop')
      .setDescription('Choose a box to open!')
      .addFields(
        {
          name: `${BOXES.rare.emoji} Rare — ${BOXES.rare.cost}`,
          value: rareRewards,
        },
        {
          name: `${BOXES.premium.emoji} Premium — ${BOXES.premium.cost}`,
          value: premiumRewards,
        },
        {
          name: `${BOXES.luxury.emoji} Luxury — ${BOXES.luxury.cost}`,
          value: luxuryRewards,
        }
      )
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('buy_rare')
        .setLabel('Buy Rare')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId('buy_premium')
        .setLabel('Buy Premium')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId('buy_luxury')
        .setLabel('Buy Luxury')
        .setStyle(ButtonStyle.Success)
    );

    return message.reply({ embeds: [embed], components: [row] });
  },
};
