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

// COMMAND LOADER (FIXED)
function loadCommands() {
  const files = fs.readdirSync(__dirname).filter(file => {
    return (
      file.endsWith('.js') &&
      ![
        'index.js',
        'database.js',
        'variables.js'
      ].includes(file)
    );
  });

  let loaded = 0;

  for (const file of files) {
    try {
      const command = require(path.join(__dirname, file));

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

// BUTTON HANDLER (resetcoins)
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'resetcoins_cancel') {
    return interaction.update({
      content: '❌ Reset cancelled.',
      components: [],
    });
  }

  if (interaction.customId === 'resetcoins_confirm') {
    db.resetAllCoins();

    return interaction.update({
      content: '✅ All coins have been reset to 0.',
      components: [],
    });
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

// LOGIN
client.login(process.env.TOKEN);
