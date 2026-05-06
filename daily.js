const { EmbedBuilder } = require('discord.js');
const db = require('../database');

const DAILY_AMOUNT = 50;
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

module.exports = {
  name: 'daily',
  adminOnly: false,
  ownerOnly: false,
  async execute(message) {
    const userId = message.author.id;
    const now = Date.now();
    const lastDaily = db.getLastDaily(userId);
    const elapsed = now - lastDaily;

    if (elapsed < COOLDOWN_MS) {
      const remaining = COOLDOWN_MS - elapsed;
      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);

      const embed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle('⏰ Cooldown Active')
        .setDescription(`You already claimed your daily reward!\nCome back in **${hours}h ${minutes}m ${seconds}s**.`)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    db.addCoins(userId, DAILY_AMOUNT);
    db.setLastDaily(userId, now);
    const newBalance = db.getBalance(userId);

    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle('🎉 Daily Reward Claimed!')
      .setDescription(`You received **${DAILY_AMOUNT} coins**!`)
      .addFields({ name: 'New Balance', value: `**${newBalance.toLocaleString()}** coins`, inline: true })
      .setFooter({ text: 'Come back in 24 hours for more!' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
