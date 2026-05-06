const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'event',
  adminOnly: false,
  ownerOnly: false,
  async execute(message) {
    const embed = new EmbedBuilder()
      .setColor(0xf39c12)
      .setTitle('👋 Hey! I\'m Senkai\'s Bot')
      .setDescription(
        'I\'m your server\'s **Economy & Mystery Box Bot**!\n' +
        'Earn coins, open boxes, and collect rare Blox Fruits Devil Fruits.\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━'
      )
      .addFields(
        {
          name: '🪙 How to Earn Coins',
          value: [
            '**`£daily`** — Claim **50 free coins** every 24 hours',
            '**`£luck`** — Roll for **0–30 random coins** every 2h 30m',
            '**💬 Chat**  — Send **20 messages** to earn **15 coins** automatically',
          ].join('\n'),
        },
        {
          name: '🎁 Mystery Box System',
          value: [
            'Spend your coins to open mystery boxes and win rare **Devil Fruits**!',
            '',
            '🟦 **Rare Box** — `£shop` → **1,500 coins**',
            '> Shadow, Blizzard, Buddha, Portal Fruit',
            '🟪 **Premium Box** — `£shop` → **2,500 coins**',
            '> T-Rex, Pain, Dough, Buddha & Portal Fruit',
            '🟨 **Luxury Box** — `£shop` → **3,600 coins**',
            '> Lightning, Tiger, Gas, Yeti Fruit',
          ].join('\n'),
        },
        {
          name: '📋 Your Commands',
          value: [
            '`£balance` — Check your coin balance',
            '`£daily` — Claim daily coins',
            '`£luck` — Try your luck for bonus coins',
            '`£shop` — Open the Mystery Box shop',
            '`£inventory` — View your collected fruits',
            '`£leaderboard` — See who has the most coins',
            '`£help` — Full command list',
          ].join('\n'),
        },
        {
          name: '💡 Tips',
          value: [
            '• Chat regularly to rack up coins passively',
            '• Claim `£daily` and `£luck` every day for free coins',
            '• Save up for the 🟨 Luxury Box for the rarest fruits!',
          ].join('\n'),
        }
      )
      .setFooter({ text: 'Good luck and have fun! 🍀' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
