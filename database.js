const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
const dbPath = path.join(dbDir, 'economy.db');

let db;

async function init() {
  const SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      coins INTEGER DEFAULT 0,
      last_daily INTEGER DEFAULT 0,
      last_message_reward INTEGER DEFAULT 0,
      message_count INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      item_name TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      UNIQUE(user_id, item_name)
    );
    CREATE TABLE IF NOT EXISTS redeemed_codes (
      user_id TEXT NOT NULL,
      code TEXT NOT NULL,
      redeemed_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, code)
    );
  `);
  try { db.run('ALTER TABLE users ADD COLUMN last_luck INTEGER DEFAULT 0'); } catch {}
  save();
}

function save() {
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

function query(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function run(sql, params = []) {
  db.run(sql, params);
  save();
}

function getUser(userId) {
  let rows = query('SELECT * FROM users WHERE user_id = ?', [userId]);
  if (rows.length === 0) {
    run('INSERT INTO users (user_id) VALUES (?)', [userId]);
    rows = query('SELECT * FROM users WHERE user_id = ?', [userId]);
  }
  return rows[0];
}

function getBalance(userId) {
  return getUser(userId).coins;
}

function addCoins(userId, amount) {
  getUser(userId);
  run('UPDATE users SET coins = coins + ? WHERE user_id = ?', [amount, userId]);
}

function removeCoins(userId, amount) {
  const user = getUser(userId);
  if (user.coins < amount) return false;
  run('UPDATE users SET coins = coins - ? WHERE user_id = ?', [amount, userId]);
  return true;
}

function setCoins(userId, amount) {
  getUser(userId);
  run('UPDATE users SET coins = ? WHERE user_id = ?', [amount, userId]);
}

function getLastDaily(userId) {
  return getUser(userId).last_daily;
}

function setLastDaily(userId, timestamp) {
  getUser(userId);
  run('UPDATE users SET last_daily = ? WHERE user_id = ?', [timestamp, userId]);
}

function incrementMessage(userId) {
  getUser(userId);
  run('UPDATE users SET message_count = message_count + 1 WHERE user_id = ?', [userId]);
  return query('SELECT message_count FROM users WHERE user_id = ?', [userId])[0].message_count;
}

function setLastMessageReward(userId, timestamp) {
  getUser(userId);
  run('UPDATE users SET last_message_reward = ?, message_count = 0 WHERE user_id = ?', [timestamp, userId]);
}

function addItem(userId, itemName, quantity = 1) {
  getUser(userId);
  run(`
    INSERT INTO inventory (user_id, item_name, quantity)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, item_name) DO UPDATE SET quantity = quantity + ?
  `, [userId, itemName, quantity, quantity]);
}

function getInventory(userId) {
  return query('SELECT item_name, quantity FROM inventory WHERE user_id = ?', [userId]);
}

function getLeaderboard(limit = 10) {
  return query('SELECT user_id, coins FROM users ORDER BY coins DESC LIMIT ?', [limit]);
}

function resetAllCoins() {
  run('UPDATE users SET coins = 0');
}

function resetInventory(userId) {
  run('DELETE FROM inventory WHERE user_id = ?', [userId]);
}

function hasRedeemedCode(userId, code) {
  const rows = query(
    'SELECT 1 FROM redeemed_codes WHERE user_id = ? AND code = ?',
    [userId, code]
  );
  return rows.length > 0;
}

function markCodeRedeemed(userId, code) {
  run(
    'INSERT OR IGNORE INTO redeemed_codes (user_id, code, redeemed_at) VALUES (?, ?, ?)',
    [userId, code, Date.now()]
  );
}

function getLastLuck(userId) {
  return getUser(userId).last_luck || 0;
}

function setLastLuck(userId, timestamp) {
  getUser(userId);
  run('UPDATE users SET last_luck = ? WHERE user_id = ?', [timestamp, userId]);
}

module.exports = {
  init,
  getBalance,
  addCoins,
  removeCoins,
  setCoins,
  resetAllCoins,
  resetInventory,
  getLastDaily,
  setLastDaily,
  incrementMessage,
  setLastMessageReward,
  addItem,
  getInventory,
  getLeaderboard,
  getLastLuck,
  setLastLuck,
  hasRedeemedCode,
  markCodeRedeemed,
};
