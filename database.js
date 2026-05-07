const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

// 📁 Safe database path setup
const dbDir = path.join(__dirname, 'data');
const dbPath = path.join(dbDir, 'economy.db');

// 🔥 Fix: if "data" exists but is NOT a folder → remove it
try {
  if (fs.existsSync(dbDir) && !fs.lstatSync(dbDir).isDirectory()) {
    fs.unlinkSync(dbDir);
  }
} catch (e) {
  console.log("Cleanup warning:", e.message);
}

// Create folder safely
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let SQL;
let db;
let isReady = false;

// INIT DB
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
      last_luck INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS inventory (
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

// QUERY
function query(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);

  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());

  stmt.free();
  return rows;
}

// RUN
function run(sql, params = []) {
  db.run(sql, params);
  save();
}

// USER GET
function getUser(userId) {
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
  run('UPDATE users SET coins = coins + ? WHERE user_id = ?', [amount, userId]);
}

function removeCoins(userId, amount) {
  const user = getUser(userId);
  if (user.coins < amount) return false;

  run('UPDATE users SET coins = coins - ? WHERE user_id = ?', [amount, userId]);
  return true;
}

function setCoins(userId, amount) {
  run('UPDATE users SET coins = ? WHERE user_id = ?', [amount, userId]);
}

// DAILY
function getLastDaily(userId) {
  return getUser(userId).last_daily || 0;
}

function setLastDaily(userId, time) {
  run('UPDATE users SET last_daily = ? WHERE user_id = ?', [time, userId]);
}

// LUCK
function getLastLuck(userId) {
  return getUser(userId).last_luck || 0;
}

function setLastLuck(userId, time) {
  run('UPDATE users SET last_luck = ? WHERE user_id = ?', [time, userId]);
}

// INVENTORY
function addItem(userId, item, qty = 1) {
  run(`
    INSERT INTO inventory (user_id, item_name, quantity)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, item_name)
    DO UPDATE SET quantity = quantity + ?
  `, [userId, item, qty, qty]);
}

function getInventory(userId) {
  return query('SELECT item_name, quantity FROM inventory WHERE user_id = ?', [userId]);
}

// LEADERBOARD
function getLeaderboard(limit = 10) {
  return query(
    'SELECT user_id, coins FROM users ORDER BY coins DESC LIMIT ?',
    [limit]
  );
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

  getLastLuck,
  setLastLuck,

  addItem,
  getInventory,

  getLeaderboard,

  resetAllCoins: () => run('UPDATE users SET coins = 0'),
  resetInventory: (userId) => run('DELETE FROM inventory WHERE user_id = ?', [userId]),
};
