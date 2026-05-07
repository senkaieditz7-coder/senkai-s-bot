  const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbDir = path.join(__dirname, 'data');
const dbPath = path.join(dbDir, 'economy.db');

let SQL;
let db;
let isReady = false;

async function init() {
  SQL = await initSqlJs();

  // IMPORTANT FIX: ensure folder is NOT a file
  if (fs.existsSync(dbDir) && !fs.lstatSync(dbDir).isDirectory()) {
    fs.unlinkSync(dbDir);
  }
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

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

function save() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

function ensure() {
  if (!isReady) throw new Error("DB not initialized");
}

function query(sql, params = []) {
  ensure();
  const stmt = db.prepare(sql);
  stmt.bind(params);

  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());

  stmt.free();
  return rows;
}

function run(sql, params = []) {
  ensure();
  db.run(sql, params);
  save();
}

// USERS
function getUser(id) {
  let u = query("SELECT * FROM users WHERE user_id = ?", [id]);
  if (!u.length) {
    run("INSERT INTO users (user_id) VALUES (?)", [id]);
    u = query("SELECT * FROM users WHERE user_id = ?", [id]);
  }
  return u[0];
}

// ECONOMY
function getBalance(id) {
  return getUser(id).coins;
}

function addCoins(id, amt) {
  run("UPDATE users SET coins = coins + ? WHERE user_id = ?", [amt, id]);
}

function removeCoins(id, amt) {
  const u = getUser(id);
  if (u.coins < amt) return false;
  run("UPDATE users SET coins = coins - ? WHERE user_id = ?", [amt, id]);
  return true;
}

function setCoins(id, amt) {
  run("UPDATE users SET coins = ? WHERE user_id = ?", [amt, id]);
}

// DAILY
function getLastDaily(id) {
  return getUser(id).last_daily;
}

function setLastDaily(id, t) {
  run("UPDATE users SET last_daily = ? WHERE user_id = ?", [t, id]);
}

// LUCK
function getLastLuck(id) {
  return getUser(id).last_luck;
}

function setLastLuck(id, t) {
  run("UPDATE users SET last_luck = ? WHERE user_id = ?", [t, id]);
}

// INVENTORY
function getInventory(id) {
  return query("SELECT item_name, quantity FROM inventory WHERE user_id = ?", [id]);
}

function addItem(id, item, qty = 1) {
  run(`
    INSERT INTO inventory (user_id, item_name, quantity)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, item_name)
    DO UPDATE SET quantity = quantity + ?
  `, [id, item, qty, qty]);
}

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
  getInventory,
  addItem,
  resetAllCoins: () => run("UPDATE users SET coins = 0"),
  resetInventory: (id) => run("DELETE FROM inventory WHERE user_id = ?", [id]),
};
