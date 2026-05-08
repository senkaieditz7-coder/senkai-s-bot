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
    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle('🎁 Mystery Box Shop')
      .setDescription('Click a button to buy a box and open it instantly!')
      .addFields(
        {
          name: `${BOXES.rare.emoji} Rare Box — ${BOXES.rare.cost} coins`,
          value: BOXES.rare.rewards.map(r => `• ${r.name}`).join('\n'),
        },
        {
          name: `${BOXES.premium.emoji} Premium Box — ${BOXES.premium.cost} coins`,
          value: BOXES.premium.rewards.map(r => `• ${r.name}`).join('\n'),
        },
        {
          name: `${BOXES.luxury.emoji} Luxury Box — ${BOXES.luxury.cost} coins`,
          value: BOXES.luxury.rewards.map(r => `• ${r.name}`).join('\n'),
        }
      )
      .setFooter({ text: 'Earn coins with £daily & luck!' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('buy_rare')
        .setLabel(`Buy Rare (${BOXES.rare.cost})`)
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId('buy_premium')
        .setLabel(`Buy Premium (${BOXES.premium.cost})`)
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId('buy_luxury')
        .setLabel(`Buy Luxury (${BOXES.luxury.cost})`)
        .setStyle(ButtonStyle.Success)
    );

    return message.reply({
      embeds: [embed],
      components: [row],
    });
  },
};
