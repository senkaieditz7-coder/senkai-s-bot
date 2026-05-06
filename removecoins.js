const db = require('../database');

module.exports = {
  name: 'removecoins',
  adminOnly: true,
  ownerOnly: false,
  async execute(message, args) {
    const target = message.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!target) return message.reply('❌ Please mention a user. Usage: `£removecoins @user amount`');
    if (!amount || amount <= 0) return message.reply('❌ Amount must be a positive number.');

    const currentBalance = db.getBalance(target.id);
    const deducted = Math.min(amount, currentBalance);
    db.setCoins(target.id, Math.max(0, currentBalance - amount));
    const newBalance = db.getBalance(target.id);

    await message.reply(`❌ Removed **${deducted.toLocaleString()} coins** from ${target}. They now have **${newBalance.toLocaleString()} coins**.`);
  },
};
