const db = require('./database');

const BOXES = {
  rare: {
    name: 'Rare Box',
    emoji: '🟦',
    cost: 1500,
    rewards: [
      { type: 'item', name: 'Shadow Fruit', chance: 30 },
      { type: 'item', name: 'Blizzard Fruit', chance: 30 },
      { type: 'item', name: 'Buddha Fruit', chance: 25 },
      { type: 'item', name: 'Portal Fruit', chance: 15 },
    ],
  },

  premium: {
    name: 'Premium Box',
    emoji: '🟪',
    cost: 2500,
    rewards: [
      { type: 'item', name: 'T-Rex Fruit', chance: 40 },
      { type: 'item', name: 'Pain Fruit', chance: 35 },
      { type: 'item', name: 'Buddha Fruit', chance: 18 },
      { type: 'item', name: 'Dough Fruit', chance: 7 },
    ],
  },

  luxury: {
    name: 'Luxury Box',
    emoji: '🟨',
    cost: 3600,
    rewards: [
      { type: 'item', name: 'Lightning Fruit', chance: 40 },
      { type: 'item', name: 'Gas Fruit', chance: 35 },
      { type: 'item', name: 'Tiger Fruit', chance: 15 },
      { type: 'item', name: 'Yeti Fruit', chance: 10 },
    ],
  },
};

// 🎲 reward roller
function rollReward(box) {
  const roll = Math.random() * 100;
  let sum = 0;

  for (const r of box.rewards) {
    sum += r.chance;
    if (roll <= sum) return r;
  }

  return box.rewards[box.rewards.length - 1];
}

module.exports = {
  name: 'boxes',

  async execute(message, args) {
    const type = args[0]?.toLowerCase();

    if (!type || !BOXES[type]) {
      return message.reply(
        `📦 Available boxes:\n` +
        Object.entries(BOXES)
          .map(([k, v]) => `• **${k}** (${v.emoji}) - ${v.cost} coins`)
          .join('\n')
      );
    }

    const userId = message.author.id;
    const box = BOXES[type];

    const balance = db.getBalance(userId) ?? 0;

    if (balance < box.cost) {
      return message.reply(`❌ You need ${box.cost} coins for this box.`);
    }

    db.removeCoins(userId, box.cost);

    const reward = rollReward(box);

    db.addItem(userId, reward.name, 1);

    const newBalance = db.getBalance(userId) ?? 0;

    return message.reply(
      `📦 You opened **${box.name}** ${box.emoji}\n` +
      `🎁 You got **${reward.name}**\n` +
      `💰 Balance: ${newBalance.toLocaleString()} coins`
    );
  },
};

// ✅ IMPORTANT EXPORT (fix for shop.js)
module.exports.BOXES = BOXES;
