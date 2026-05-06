const db = require('../database');

const CODES = {
  WELCOME100: { coins: 100 },
};

module.exports = {
  name: 'redeem',
  adminOnly: false,
  ownerOnly: false,
  async execute(message, args) {
    const code = args[0]?.toUpperCase();

    if (!code) {
      return message.reply('❌ Please provide a code. Usage: `£redeem <code>`');
    }

    if (!CODES[code]) {
      return message.reply('❌ Invalid code.');
    }

    const userId = message.author.id;
    const alreadyUsed = db.hasRedeemedCode(userId, code);

    if (alreadyUsed) {
      return message.reply('⚠️ You already redeemed this code.');
    }

    const reward = CODES[code];
    db.markCodeRedeemed(userId, code);
    db.addCoins(userId, reward.coins);
    const newBalance = db.getBalance(userId);

    await message.reply(`🎁 You redeemed **${code}** and got **${reward.coins} coins**!\nNew balance: **${newBalance.toLocaleString()} coins**`);
  },
};
