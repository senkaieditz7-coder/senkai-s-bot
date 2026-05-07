const db = require('./database');

module.exports = {
  name: 'removecoins',
  adminOnly: true,
  ownerOnly: false,

  async execute(message, args) {
    const target = message.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!target) {
      return message.reply('❌ Please mention a user. Usage: £removecoins @user amount');
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      return message.reply('❌ Amount must be a positive number.');
    }

    const currentBalance = db.getBalance(target.id) ?? 0;

    const deducted = Math.min(amount, currentBalance);
    const newBalance = Math.max(0, currentBalance - amount);

    db.setCoins(target.id, newBalance);

    return message.reply(
      `❌ Removed **${deducted.toLocaleString()} coins** from ${target}. They now have **${newBalance.toLocaleString()} coins**.`
    );
  },
};
