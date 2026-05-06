require('dotenv').config();

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

// 🔐 ENV TOKEN
const TOKEN = process.env.DISCORD_TOKEN;

// Channels
const COMMAND_CHANNELS = ['1492918524878786563', '1492918525105275033'];
const REWARD_CHANNELS = ['1492918524367343853', '1492918525105275032'];

// Settings
const PREFIX = '£';
const MESSAGE_REWARD_AMOUNT = 15;
const MESSAGES_NEEDED = 20;
const SPAM_COOLDOWN_MS = 2000;
const REWARD_COOLDOWN_MS = 120000;

// Memory
const userLastMessage = new Map();
const userRewardCooldown = new Map();

// 🚨 GLOBAL ERROR HANDLING (VERY IMPORTANT)
process.on('unhandledRejection', (err) => {
  console.error("UNHANDLED REJECTION:", err);
});

process.on('uncaughtException', (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

// Create client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

// 🧠 SAFE START FUNCTION
async function startBot() {
  console.log("🚀 Booting bot...");

  // ---------- DATABASE ----------
  let db = null;
  try {
    db = require('./database');

    if (db && typeof db.init === "function") {
      await db.init();
      console.log("🗄️ Database connected");
    } else {
      console.log("⚠️ No DB init found, skipping");
    }
  } catch (err) {
    console.log("⚠️ Database failed, continuing without it");
    console.error(err);
  }

  // ---------- COMMAND LOADER ----------
  try {
    const commandsPath = path.join(__dirname, 'commands');

    if (fs.existsSync(commandsPath)) {
      const files = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

      for (const file of files) {
        try {
          const cmd = require(path.join(commandsPath, file));
          if (cmd?.name && cmd?.execute) {
            client.commands.set(cmd.name, cmd);
          }
        } catch (err) {
          console.log(`❌ Failed command: ${file}`);
          console.error(err);
        }
      }
    }

    console.log(`📦 Commands loaded: ${client.commands.size}`);
  } catch (err) {
    console.log("⚠️ Command loader failed, continuing bot");
    console.error(err);
  }

  // ---------- READY EVENT ----------
  client.once(Events.ClientReady, () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
  });

  // ---------- MESSAGE HANDLER ----------
  client.on(Events.MessageCreate, async (message) => {
    try {
      if (message.author.bot || !message.guild) return;

      const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator);

      // COMMANDS
      if (message.content.startsWith(PREFIX)) {
        const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
        const commandName = args.shift()?.toLowerCase();

        const command = client.commands.get(commandName);
        if (!command) return;

        if (!COMMAND_CHANNELS.includes(message.channel.id) && !isAdmin) {
          return message.reply(`❌ Use commands in <#${COMMAND_CHANNELS[0]}>`);
        }

        try {
          await command.execute(message, args, client);
        } catch (err) {
          console.error("COMMAND ERROR:", err);
        }
        return;
      }

      // REWARD SYSTEM
      if (!REWARD_CHANNELS.includes(message.channel.id)) return;

      const IGNORED = ['?', '!', '£', '$'];
      if (IGNORED.some(p => message.content.startsWith(p))) return;

      const userId = message.author.id;
      const now = Date.now();

      const last = userLastMessage.get(userId) || 0;
      if (now - last < SPAM_COOLDOWN_MS) return;
      userLastMessage.set(userId, now);

      const lastReward = userRewardCooldown.get(userId) || 0;
      if (now - lastReward < REWARD_COOLDOWN_MS) return;

      if (db?.incrementMessage && db?.addCoins) {
        const count = db.incrementMessage(userId);

        if (count >= MESSAGES_NEEDED) {
          db.addCoins(userId, MESSAGE_REWARD_AMOUNT);
          userRewardCooldown.set(userId, now);

          await message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor(0x2ecc71)
                .setDescription(`💬 ${message.author} earned **${MESSAGE_REWARD_AMOUNT} coins**!`)
            ]
          });
        }
      }

    } catch (err) {
      console.error("MESSAGE HANDLER ERROR:", err);
    }
  });

  // ---------- LOGIN ----------
  if (!TOKEN) {
    throw new Error("DISCORD_TOKEN missing in environment variables");
  }

  await client.login(TOKEN);

  console.log("💓 Bot fully running and stable");
}

// 🚀 START BOT SAFELY
startBot().catch(err => {
  console.error("💥 BOT FAILED TO START:", err);
});