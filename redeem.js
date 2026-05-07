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
      return message.reply('❌ Usage: £redeem <code>');
    }

    if (!CODES[code]) {
      return message.reply('❌ Invalid code.');
    }

    const userId = message.author.id;

    // check if already used
    if (db.hasRedeemedCode(userId, code)) {
      return message.reply('⚠️ You already used this code.');
    }

    const reward = CODES[code];

    // save redemption
    db.markCodeRedeemed(userId, code);

    // give coins
    db.addCoins(userId, reward.coins);

    const newBalance = db.getBalance(userId);

    return message.reply(
      `🎁 Redeemed **${code}**!\n` +
      `💰 +${reward.coins} coins\n` +
      `🏦 Balance: ${newBalance.toLocaleString()} coins`
    );
  },
};
