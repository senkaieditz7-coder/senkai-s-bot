const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'help',
  adminOnly: false,
  ownerOnly: false,
  async execute(message) {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('📖 Bot Command List')
      .setDescription('**Prefix:** `£`  •  All commands start with `£`')
      .addFields(
        {
          name: '💰 Economy',
          value: [
            '`£balance` — Check your coin balance',
            '`£balance @user` — Check another user\'s balance',
            '`£daily` — Claim **50 coins** (24h cooldown)',
            '`£luck` — Roll for **0–30 random coins** (2h 30m cooldown)',
            '`£redeem <code>` — Redeem a code for coins',
            '`£leaderboard` — View the top 10 richest users',
          ].join('\n'),
        },
        {
          name: '🎁 Mystery Boxes',
          value: [
            '`£shop` — Open the Mystery Box shop',
            '',
            '🟦 **Rare Box** — 1,500 coins',
            '> Shadow Fruit, Blizzard Fruit, Buddha Fruit, Portal Fruit',
            '🟪 **Premium Box** — 2,500 coins',
            '> T-Rex Fruit, Pain, Dough Fruit *(low)*, Buddha & Portal Fruit *(very low)*',
            '🟨 **Luxury Box** — 3,600 coins',
            '> Lightning Fruit, Tiger Fruit *(low)*, Gas Fruit & Yeti Fruit *(very low)*',
            '',
            '`£inventory` — View your collected items',
          ].join('\n'),
        },
        {
          name: '💬 Chat Rewards',
          value: [
            '• Send **20 messages** → earn **15 coins** automatically',
            '• 2-second anti-spam between messages',
            '• 2-minute cooldown after each reward before counting restarts',
          ].join('\n'),
        },
        {
          name: '🛡️ Admin Commands',
          value: [
            '`£addcoins @user <amount>` — Add coins to a user',
            '`£removecoins @user <amount>` — Remove coins from a user',
            '`£resetinventory @user` — Wipe a user\'s entire inventory',
            '`£promote @user` — Promote a user up by 1 role',
            '`£demote @user` — Demote a user down by 1 role',
          ].join('\n'),
        },
        {
          name: '👑 Owner Only',
          value: '`£resetcoins` — Reset **all** users\' coins to 0 *(requires confirmation)*',
        },
        {
          name: '📢 Event',
          value: '`£event` — Bot introduction with all user commands and the mystery box system explained',
        },
        {
          name: '📊 Total Commands',
          value: '`15 commands` — balance, daily, luck, redeem, leaderboard, shop, inventory, event, addcoins, removecoins, resetinventory, promote, demote, resetcoins, help',
        }
      )
      .setFooter({ text: 'Economy + Mystery Box Bot  •  Prefix: £' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
