const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');

const db = require('./database');
const { OWNER_ID } = require('./variables'); // your ID file

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

const PREFIX = '£';

// folder where commands are stored (same folder as index.js)
const COMMAND_DIR = __dirname;

// LOAD COMMANDS
function loadCommands() {
  const files = fs.readdirSync(COMMAND_DIR)
    .filter(file => file.endsWith('.js'))
    .filter(file => !['index.js', 'database.js', 'boxes.js', 'variables.js'].includes(file));

  let loaded = 0;

  for (const file of files) {
    try {
      const command = require(path.join(COMMAND_DIR, file));

      if (!command?.name || !command?.execute) {
        console.log(`⚠️ Skipped invalid command: ${file}`);
        continue;
      }

      client.commands.set(command.name, command);
      console.log(`✅ Loaded command: ${command.name}`);
      loaded++;
    } catch (err) {
      console.log(`❌ Error loading ${file}: ${err.message}`);
    }
  }

  console.log(`📦 FINAL COMMANDS: [${[...client.commands.keys()].join(', ')}]`);
  if (loaded === 0) console.log('❌ No commands loaded!');
}

// MESSAGE HANDLER
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const cmdName = args.shift().toLowerCase();

  const command = client.commands.get(cmdName);
  if (!command) return message.reply('❌ Unknown command.');

  // OWNER CHECK
  if (command.ownerOnly && message.author.id !== OWNER_ID) {
    return message.reply('❌ This command is owner-only.');
  }

  // ADMIN CHECK (optional: only works if you use Discord permissions)
  if (command.adminOnly && !message.member.permissions.has('Administrator')) {
    return message.reply('❌ Admin only command.');
  }

  try {
    await command.execute(message, args, client);
  } catch (err) {
    console.log(err);
    message.reply('❌ Command error.');
  }
});

// READY EVENT
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  try {
    await db.init();
    console.log('📦 Database ready');
  } catch (e) {
    console.log('❌ DB error:', e.message);
  }

  loadCommands();
});

client.login(process.env.TOKEN);
