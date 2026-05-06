const db = require('../database');

module.exports = {
  name: 'addcoins',
  adminOnly: true,
  ownerOnly: false,
  async execute(message, args) {
    const target = message.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!target) return message.reply('❌ Please mention a user. Usage: `£addcoins @user amount`');
    if (!amount || amount <= 0) return message.reply('❌ Amount must be a positive number.');

    db.addCoins(target.id, amount);
    const newBalance = db.getBalance(target.id);

    await message.reply(`✅ Added **${amount.toLocaleString()} coins** to ${target}. They now have **${newBalance.toLocaleString()} coins**.`);
  },
};
