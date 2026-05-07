const db = require('./database');

const CODES = {
  WELCOME100: { coins: 100 },
  COMEBACK150: { coins: 150 },
};

module.exports = {
  name: 'redeem',
  adminOnly: false,
  ownerOnly: false,

  async execute(message, args) {
    const code = args[0]?.toUpperCase();

    if (!code) {
      return message.reply('❌ Usage: `£redeem <code>`');
    }

    if (!CODES[code]) {
      return message.reply('❌ Invalid code.');
    }

    const userId = message.author.id;

    const alreadyUsed = db.hasRedeemedCode(userId, code);
    if (alreadyUsed) {
      return message.reply('⚠️ You already used this code.');
    }

    const reward = CODES[code];

    db.markCodeRedeemed(userId, code);
    db.addCoins(userId, reward.coins);

    const newBalance = db.getBalance(userId);

    await message.reply(
      `🎁 Code **${code}** redeemed!\n` +
      `💰 You got **${reward.coins} coins**\n` +
      `🏦 New balance: **${newBalance.toLocaleString()} coins**`
    );
  },
};
