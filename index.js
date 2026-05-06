const {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  EmbedBuilder,
  PermissionsBitField,
} = require('discord.js');

const fs = require('fs');
const path = require('path');
const db = require('./database');

// ===== CONFIG =====
const TOKEN = process.env.TOKEN;

const OWNER_ID = '1461290677647179816';

const PREFIX = '£';

const COMMAND_CHANNELS = ['1492918524878786563', '1492918525105275033'];
const REWARD_CHANNELS = ['1492918524367343853', '1492918525105275032'];

const MESSAGE_REWARD_AMOUNT = 15;
const MESSAGES_NEEDED = 20;

const SPAM_COOLDOWN_MS = 2000;
const REWARD_COOLDOWN_MS = 120000;

// ===== MEMORY =====
const userLastMessage = new Map();
const userRewardCooldown = new Map();

// ===== CLIENT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

// ===== MAIN START =====
async function startBot() {
  await db.init();

  // Load commands
  const commandsPath = path.join(__dirname, 'commands');

  if (fs.existsSync(commandsPath)) {
    const files = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

    for (const file of files) {
      const command = require(path.join(commandsPath, file));
      if (command.name && command.execute) {
        client.commands.set(command.name, command);
      }
    }
  }

  // Ready event
  client.once(Events.ClientReady, () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
  });

  // Message handler
  client.on(Events.MessageCreate, async (message) => {
    if (!message.guild || message.author.bot) return;

    const isAdmin = message.member?.permissions?.has(
      PermissionsBitField.Flags.Administrator
    );

    // ===== OWNER MESSAGE =====
    if (message.author.id === OWNER_ID && message.content === 'Hi kids') {
      return message.reply('Hi Master! Keep up the great work :)');
    }

    // ===== PREFIX COMMANDS =====
    if (message.content.startsWith(PREFIX)) {
      const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
      const commandName = args.shift()?.toLowerCase();

      const command = client.commands.get(commandName);
      if (!command) return;

      if (!COMMAND_CHANNELS.includes(message.channel.id) && !isAdmin) {
        return message.reply(
          `❌ Use commands only in <#${COMMAND_CHANNELS[0]}>`
        );
      }

      try {
        await command.execute(message, args, client);
      } catch (err) {
        console.error(err);
        message.reply('❌ Command error.');
      }

      return;
    }

    // ===== REWARD SYSTEM =====
    if (!REWARD_CHANNELS.includes(message.channel.id)) return;

    const ignorePrefixes = ['?', '!', '£', '$'];
    if (ignorePrefixes.some(p => message.content.startsWith(p))) return;

    if (message.content.length < 3) return;

    const userId = message.author.id;
    const now = Date.now();

    const lastMsg = userLastMessage.get(userId) || 0;
    if (now - lastMsg < SPAM_COOLDOWN_MS) return;
    userLastMessage.set(userId, now);

    const lastReward = userRewardCooldown.get(userId) || 0;
    if (now - lastReward < REWARD_COOLDOWN_MS) return;

    const count = db.incrementMessage(userId);

    if (count >= MESSAGES_NEEDED) {
      db.addCoins(userId, MESSAGE_REWARD_AMOUNT);
      userRewardCooldown.set(userId, now);

      message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2ecc71)
            .setDescription(
              `💬 ${message.author} earned **${MESSAGE_REWARD_AMOUNT} coins!**`
            ),
        ],
      });
    }
  });

  client.on('error', console.error);

  // LOGIN (IMPORTANT — NO AWAIT)
  client.login(TOKEN);
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught exception:', err);
});

startBot().catch((err) => {
  console.error('❌ Fatal error during bot startup:', err);
  process.exit(1);
});
