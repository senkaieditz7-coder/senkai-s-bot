console.log("BOT INSTANCE STARTED:", process.pid, new Date().toISOString());

const fs = require('fs');
const path = require('path');
const {
  Client,
  GatewayIntentBits,
  Collection
} = require('discord.js');

const db = require('./database');
const { OWNER_ID } = require('./variables');
const { BOXES, rollReward } = require('./boxes');

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
    !['index.js', 'database.js', 'variables.js', 'boxes.js'].includes(file)
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


// ---------------- INTERACTION HANDLER (ALL BUTTONS) ----------------
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const userId = interaction.user.id;

  // ---------------- RESET COINS ----------------
  if (interaction.customId === 'resetcoins_cancel') {
    return interaction.update({
      content: '❌ Reset cancelled.',
      components: [],
    });
  }

  if (interaction.customId === 'resetcoins_confirm') {
    if (userId !== OWNER_ID) {
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

  // ---------------- SHOP BUTTONS ----------------
  let type = null;

  if (interaction.customId === 'buy_rare') type = 'rare';
  if (interaction.customId === 'buy_premium') type = 'premium';
  if (interaction.customId === 'buy_luxury') type = 'luxury';

  if (!type) return;

  const box = BOXES[type];
  const balance = db.getBalance(userId) ?? 0;

  if (balance < box.cost) {
    return interaction.reply({
      content: `❌ You need ${box.cost} coins.`,
      ephemeral: true,
    });
  }

  db.removeCoins(userId, box.cost);

  const reward = rollReward(box);

  db.addItem(userId, reward.name, 1);

  return interaction.reply({
    content: `📦 You opened **${box.name}** and got **${reward.name}** 🎁`,
    ephemeral: true,
  });
});


// ---------------- READY EVENT ----------------
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
