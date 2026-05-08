const BOXES = {
  rare: {
    name: 'Rare Box',
    emoji: '🟦',
    cost: 1500,
    rewards: [
      { name: 'Shadow Fruit', chance: 30 },
      { name: 'Blizzard Fruit', chance: 30 },
      { name: 'Buddha Fruit', chance: 25 },
      { name: 'Portal Fruit', chance: 15 },
    ],
  },

  premium: {
    name: 'Premium Box',
    emoji: '🟪',
    cost: 2500,
    rewards: [
      { name: 'T-Rex Fruit', chance: 40 },
      { name: 'Pain Fruit', chance: 35 },
      { name: 'Buddha Fruit', chance: 18 },
      { name: 'Dough Fruit', chance: 7 },
    ],
  },

  luxury: {
    name: 'Luxury Box',
    emoji: '🟨',
    cost: 3600,
    rewards: [
      { name: 'Lightning Fruit', chance: 40 },
      { name: 'Gas Fruit', chance: 35 },
      { name: 'Tiger Fruit', chance: 15 },
      { name: 'Yeti Fruit', chance: 10 },
    ],
  },
};

// 🎲 reward picker
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
  BOXES,
  rollReward,
};
