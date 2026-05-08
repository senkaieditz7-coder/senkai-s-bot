const fs = require('fs');
const path = require('path');
const {
  Client,
  GatewayIntentBits,
  Collection
} = require('discord.js');

const db = require('./database');
const { OWNER_ID } = require('./variables');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

const PREFIX = '£';


// ---------------- COMMAND LOADER ----------------
function loadCommands() {
  const files = fs.readdirSync(__dirname).filter(file =>
    file.endsWith('.js') &&
    !['index.js', 'database.js', 'variables.js'].includes(file)
  );

  for (const file of files) {
    try {
      const cmd = require(path.join(__dirname, file));

      if (!cmd?.name || !cmd?.execute) {
        console.log(`⚠️ Skipped invalid command: ${file}`);
        continue;
      }

      client.commands.set(cmd.name, cmd);
      console.log(`✅ Loaded command: ${cmd.name}`);
    } catch (err) {
      console.log(`❌ Error loading ${file}: ${err.message}`);
    }
  }

  console.log(`📦 FINAL COMMANDS: [${[...client.commands.keys()].join(', ')}]`);
}


// ---------------- MESSAGE HANDLER ----------------
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const cmdName = args.shift().toLowerCase();

  const command = client.commands.get(cmdName);
  if (!command) return message.reply('❌ Unknown command.');

  try {
    await command.execute(message, args, client);
  } catch (err) {
    console.log(err);
    message.reply('❌ Command error.');
  }
});


// ---------------- BUTTON HANDLER ----------------
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'resetcoins_cancel') {
    return interaction.update({
      content: '❌ Reset cancelled.',
      components: [],
    });
  }

  if (interaction.customId === 'resetcoins_confirm') {
    if (interaction.user.id !== OWNER_ID) {
      return interaction.reply({
        content: '❌ Only owner can use this.',
        ephemeral: true,
      });
    }

    db.resetAllCoins();

    return interaction.update({
      content: '✅ All coins reset successfully.',
      components: [],
    });
  }
});


// ---------------- READY EVENT (FIXED) ----------------
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  try {
    await db.init();
    console.log('📦 Database ready');
  } catch (err) {
    console.log('❌ DB error:', err.message);
  }

  loadCommands();
});


// ---------------- LOGIN ----------------
client.login(process.env.TOKEN);
