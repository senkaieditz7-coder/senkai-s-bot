const BOXES = {
  rare: {
    name: 'Rare Box',
    emoji: '🟦',
    cost: 1500,
    color: 0x3498db,
    rewards: [
      { type: 'item', name: 'Shadow Fruit',   emojiName: 'Shadow_Fruit',   fallback: '🌑', chance: 30 },
      { type: 'item', name: 'Blizzard Fruit', emojiName: 'Blizzard_Fruit', fallback: '🌨️', chance: 30 },
      { type: 'item', name: 'Buddha Fruit',   emojiName: 'Buddha_Fruit',   fallback: '🧘', chance: 25 },
      { type: 'item', name: 'Portal Fruit',   emojiName: 'Portal_Fruit',   fallback: '🌀', chance: 15 },
    ],
  },
  premium: {
    name: 'Premium Box',
    emoji: '🟪',
    cost: 2500,
    color: 0x9b59b6,
    rewards: [
      { type: 'item', name: 'T-Rex Fruit',           emojiName: 'TRex_Fruit',                  fallback: '🦖', chance: 40 },
      { type: 'item', name: 'Pain Fruit',            emojiName: 'Pain',                        fallback: '💢', chance: 35 },
      { type: 'item', name: 'Buddha & Portal Fruit', emojiName: ['Buddha_Fruit', 'Portal_Fruit'], fallback: '🧘🌀', chance: 18 },
      { type: 'item', name: 'Dough Fruit',           emojiName: 'Dough_Fruit',                 fallback: '🍩', chance: 7  },
    ],
  },
  luxury: {
    name: 'Luxury Box',
    emoji: '🟨',
    cost: 3600,
    color: 0xf1c40f,
    rewards: [
      { type: 'item', name: 'Lightning Fruit', emojiName: 'Lightning_Fruit', fallback: '⚡',  chance: 40 },
      { type: 'item', name: 'Gas Fruit',       emojiName: 'Gas_Fruit',       fallback: '🌫️', chance: 35 },
      { type: 'item', name: 'Tiger Fruit',     emojiName: 'Tiger_Fruit',     fallback: '🐅',  chance: 15 },
      { type: 'item', name: 'Yeti Fruit',      emojiName: 'Yeti_Fruit',      fallback: '🏔️', chance: 10 },
    ],
  },
};

function rollReward(boxKey) {
  const box = BOXES[boxKey];
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const reward of box.rewards) {
    cumulative += reward.chance;
    if (roll < cumulative) return reward;
  }
  return box.rewards[box.rewards.length - 1];
}

function getRewardEmoji(client, reward) {
  const { getEmoji } = require('./utils/emojis');
  if (Array.isArray(reward.emojiName)) {
    return reward.emojiName.map(n => getEmoji(client, n, '')).join('') || reward.fallback;
  }
  return getEmoji(client, reward.emojiName, reward.fallback);
}

function getRewardLabel(client, reward) {
  return `${reward.name} ${getRewardEmoji(client, reward)}`;
}

module.exports = { BOXES, rollReward, getRewardLabel };
