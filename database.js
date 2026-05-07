const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const dbPath = path.join(dbDir, 'economy.db');

let SQL;
let db;
let isReady = false;

// INIT DATABASE
async function init() {
  SQL = await initSqlJs();

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
      message_count INTEGER DEFAULT 0,
      last_luck INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      item_name TEXT,
      quantity INTEGER DEFAULT 1,
      UNIQUE(user_id, item_name)
    );

    CREATE TABLE IF NOT EXISTS redeemed_codes (
      user_id TEXT,
      code TEXT,
      redeemed_at INTEGER,
      PRIMARY KEY (user_id, code)
    );
  `);

  save();
  isReady = true;
}

// SAVE DB
function save() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

// SAFE QUERY
function query(sql, params = []) {
  if (!db) return [];

  const stmt = db.prepare(sql);
  stmt.bind(params);

  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());

  stmt.free();
  return rows;
}

// SAFE RUN
function run(sql, params = []) {
  if (!db) return;

  db.run(sql, params);
  save();
}

// WAIT FOR DB
function ensureReady() {
  if (!isReady) throw new Error('Database not initialized. Call init() first.');
}

// USER SYSTEM
function getUser(userId) {
  ensureReady();

  let rows = query('SELECT * FROM users WHERE user_id = ?', [userId]);

  if (rows.length === 0) {
    run('INSERT INTO users (user_id) VALUES (?)', [userId]);
    rows = query('SELECT * FROM users WHERE user_id = ?', [userId]);
  }

  return rows[0];
}

// ECONOMY
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

// DAILY
function getLastDaily(userId) {
  return getUser(userId).last_daily || 0;
}

function setLastDaily(userId, time) {
  run('UPDATE users SET last_daily = ? WHERE user_id = ?', [time, userId]);
}

// MESSAGE SYSTEM
function incrementMessage(userId) {
  getUser(userId);

  run(
    'UPDATE users SET message_count = message_count + 1 WHERE user_id = ?',
    [userId]
  );

  return query(
    'SELECT message_count FROM users WHERE user_id = ?',
    [userId]
  )[0].message_count;
}

// INVENTORY
function addItem(userId, item, qty = 1) {
  getUser(userId);

  run(`
    INSERT INTO inventory (user_id, item_name, quantity)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, item_name)
    DO UPDATE SET quantity = quantity + ?
  `, [userId, item, qty, qty]);
}

function getInventory(userId) {
  return query(
    'SELECT item_name, quantity FROM inventory WHERE user_id = ?',
    [userId]
  );
}

// LEADERBOARD
function getLeaderboard(limit = 10) {
  return query(
    'SELECT user_id, coins FROM users ORDER BY coins DESC LIMIT ?',
    [limit]
  );
}

// LUCK
function getLastLuck(userId) {
  return getUser(userId).last_luck || 0;
}

function setLastLuck(userId, time) {
  run('UPDATE users SET last_luck = ? WHERE user_id = ?', [time, userId]);
}

// EXPORT
module.exports = {
  init,

  getBalance,
  addCoins,
  removeCoins,
  setCoins,

  getLastDaily,
  setLastDaily,

  incrementMessage,

  addItem,
  getInventory,

  getLeaderboard,

  getLastLuck,
  setLastLuck,

  resetAllCoins: () => run('UPDATE users SET coins = 0'),
  resetInventory: (userId) => run('DELETE FROM inventory WHERE user_id = ?', [userId]),
};
