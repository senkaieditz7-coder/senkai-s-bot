const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const db = require('./database');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

const PREFIX = '£';

// ONLY LOAD REAL COMMAND FILES
const COMMAND_DIR = __dirname;

function loadCommands() {
  const files = fs.readdirSync(COMMAND_DIR)
    .filter(f => f.endsWith('.js'))
    .filter(f => !['index.js', 'database.js', 'boxes.js'].includes(f));

  client.commands.clear();

  for (const file of files) {
    try {
      delete require.cache[require.resolve(path.join(COMMAND_DIR, file))];

      const command = require(path.join(COMMAND_DIR, file));

      if (!command?.name || !command?.execute) {
        console.log(`⚠️ Skipped invalid command: ${file}`);
        continue;
      }

      client.commands.set(command.name, command);
      console.log(`✅ Loaded command: ${command.name}`);
    } catch (err) {
      console.log(`❌ Error loading ${file}: ${err.message}`);
    }
  }

  console.log(`📦 FINAL COMMANDS: [${[...client.commands.keys()].join(', ')}]`);
}

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const cmdName = args.shift().toLowerCase();

  const command = client.commands.get(cmdName);

  if (!command) {
    return message.reply('❌ Unknown command.');
  }

  try {
    await command.execute(message, args, client);
  } catch (err) {
    console.log(err);
    message.reply('❌ Command error.');
  }
});

// FIXED READY EVENT
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  db.init()
    .then(() => console.log('📦 Database ready'))
    .catch(err => console.log('❌ DB error:', err.message));

  loadCommands();
});

client.login(process.env.TOKEN);
