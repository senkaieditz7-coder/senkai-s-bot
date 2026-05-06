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

// 💥 safety nets
process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

async function main() {
  console.log("🚀 Starting bot...");

  // load DB safely
  let db = null;
  try {
    db = require('./database');
    if (db?.init) await db.init();
    console.log("🗄️ Database ready");
  } catch (e) {
    console.log("⚠️ Database disabled (error ignored)");
  }

  // load commands safely
  try {
    const commandsPath = path.join(__dirname, 'commands');

    if (fs.existsSync(commandsPath)) {
      const files = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

      for (const file of files) {
        try {
          const cmd = require(path.join(commandsPath, file));
          if (cmd.name && cmd.execute) {
            client.commands.set(cmd.name, cmd);
          }
        } catch (e) {
          console.log(`❌ Skipped command: ${file}`);
        }
      }
    }

    console.log(`📦 Commands loaded: ${client.commands.size}`);
  } catch (e) {
    console.log("⚠️ Command system disabled");
  }

  client.once(Events.ClientReady, () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
  });

  client.on(Events.MessageCreate, async (message) => {
    try {
      if (message.author.bot || !message.guild) return;

      const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator);

      // commands
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
          console.error("Command error:", err);
        }
        return;
      }

      // rewards
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
      console.error("Message error:", err);
    }
  });

  if (!TOKEN) {
    console.error("❌ Missing DISCORD_TOKEN in Railway Variables!");
    process.exit(1);
  }

  await client.login(TOKEN);

  console.log("💓 Bot is running and stable");
}

main();

// 🧠 KEEP PROCESS ALIVE (IMPORTANT FOR RAILWAY)
setInterval(() => {
  // keeps Node alive
}, 60 * 60 * 1000);