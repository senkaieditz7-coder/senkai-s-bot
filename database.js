const fs = require('fs');

const DB_PATH = './data.json';

// ---------------- SAFE INIT ----------------
function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = {
      users: {},
      redeemed: {}
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
  }

  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ---------------- USER SYSTEM ----------------
function getUser(data, userId) {
  if (!data.users[userId]) {
    data.users[userId] = {
      coins: 0,
      inventory: {}
    };
  }
  return data.users[userId];
}

// ---------------- COINS ----------------
function getBalance(userId) {
  const data = loadDB();
  return getUser(data, userId).coins;
}

function addCoins(userId, amount) {
  const data = loadDB();
  const user = getUser(data, userId);

  user.coins += amount;
  saveDB(data);
}

function removeCoins(userId, amount) {
  const data = loadDB();
  const user = getUser(data, userId);

  user.coins = Math.max(0, user.coins - amount);
  saveDB(data);
}

// ---------------- INVENTORY ----------------
function addItem(userId, item, amount = 1) {
  const data = loadDB();
  const user = getUser(data, userId);

  user.inventory[item] = (user.inventory[item] || 0) + amount;
  saveDB(data);
}

function getInventory(userId) {
  const data = loadDB();
  return getUser(data, userId).inventory;
}

function resetInventory(userId) {
  const data = loadDB();
  const user = getUser(data, userId);

  user.inventory = {};
  saveDB(data);
}

// ---------------- REDEEM SYSTEM ----------------
function hasRedeemedCode(userId, code) {
  const data = loadDB();
  return data.redeemed[userId]?.includes(code);
}

function markCodeRedeemed(userId, code) {
  const data = loadDB();

  if (!data.redeemed[userId]) {
    data.redeemed[userId] = [];
  }

  data.redeemed[userId].push(code);
  saveDB(data);
}

// ---------------- RESET SYSTEM ----------------
function resetAllCoins() {
  const data = loadDB();

  for (const userId in data.users) {
    data.users[userId].coins = 0;
  }

  saveDB(data);
}

// ---------------- LEADERBOARD (FIXED) ----------------
function getLeaderboard() {
  const data = loadDB();

  return Object.entries(data.users)
    .map(([id, user]) => ({
      id,
      coins: user.coins || 0,
    }))
    .sort((a, b) => b.coins - a.coins)
    .slice(0, 10);
}

// ---------------- INIT ----------------
function init() {
  loadDB();
}

// ---------------- EXPORTS ----------------
module.exports = {
  init,

  getBalance,
  addCoins,
  removeCoins,

  addItem,
  getInventory,
  resetInventory,

  hasRedeemedCode,
  markCodeRedeemed,

  resetAllCoins,

  getLeaderboard,
};
