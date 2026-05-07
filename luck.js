const { EmbedBuilder } = require('discord.js');
const db = require('./database');

const COOLDOWN_MS = 9000000; // 2h 30m

module.exports = {
  name: 'luck',
  adminOnly: false,
  ownerOnly: false,

  async execute(message) {
    const userId = message.author.id;
    const now = Date.now();

    const lastLuck = db.getLastLuck(userId) ?? 0;
    const elapsed = now - lastLuck;

    if (elapsed < COOLDOWN_MS) {
      const remaining = COOLDOWN_MS - elapsed;

      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);

      const embed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle('⏰ Cooldown Active')
        .setDescription(
          `You already tried your luck!\nCome back in **${hours}h ${minutes}m ${seconds}s**.`
        )
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    const reward = Math.floor(Math.random() * 31); // 0–30 coins

    db.setLastLuck(userId, now);

    if (reward === 0) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x95a5a6)
            .setTitle('😔 Bad Luck!')
            .setDescription('Aw no luck this time. Try again later!')
            .setTimestamp(),
        ],
      });
    }

    db.addCoins(userId, reward);

    const newBalance = db.getBalance(userId);

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle('🍀 Lucky!')
          .setDescription(`You got **${reward} coins**!`)
          .addFields({
            name: 'New Balance',
            value: `**${newBalance.toLocaleString()}** coins`,
            inline: true,
          })
          .setTimestamp(),
      ],
    });
  },
};
