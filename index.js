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

// TOKEN
const TOKEN = process.env.TOKEN || process.env.BOT_TOKEN;

if (!TOKEN) {
  console.error("❌ No bot token found!");
  process.exit(1);
}

// CONFIG
const PREFIX = '£';
const OWNER_ID = '1461290677647179816';

const COMMAND_CHANNELS = [
  '1492918524878786563',
  '1492918525105275033'
];

const REWARD_CHANNELS = [
  '1492918524367343853',
  '1492918525105275032'
];

// MEMORY
const userLastMessage = new Map();
const userRewardCooldown = new Map();

// CLIENT
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

// 🔥 LOAD COMMANDS FROM ROOT (YOUR STRUCTURE)
function loadCommands() {
  const files = fs.readdirSync(__dirname).filter(file => file.endsWith('.js') && file !== 'index.js');

  for (const file of files) {
    try {
      const cmd = require(path.join(__dirname, file));

      if (!cmd.name || !cmd.execute) {
        console.log(`⚠️ Skipped invalid command: ${file}`);
        continue;
      }

      client.commands.set(cmd.name, cmd);
      console.log(`✅ Loaded command: ${cmd.name}`);
    } catch (err) {
      console.error(`❌ Error loading ${file}:`, err);
    }
  }

  console.log("📦 FINAL COMMANDS:", [...client.commands.keys()]);
}

async function main() {
  await db.init();

  loadCommands();

  // READY
  client.once(Events.ClientReady, () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
  });

  // MESSAGE HANDLER
  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.guild) return;

    const isAdmin = message.member?.permissions?.has(
      PermissionsBitField.Flags.Administrator
    );

    // OWNER TEST
    if (message.author.id === OWNER_ID && message.content === 'Hi kids') {
      return message.reply('Hi Master! 💪');
    }

    // PREFIX COMMANDS
    if (message.content.startsWith(PREFIX)) {
      const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
      const commandName = args.shift()?.toLowerCase();

      console.log("INPUT COMMAND:", commandName);

      const command = client.commands.get(commandName);

      if (!command) {
        return message.reply("❌ Unknown command");
      }

      if (!COMMAND_CHANNELS.includes(message.channel.id) && !isAdmin) {
        return message.reply(`❌ Use commands in <#${COMMAND_CHANNELS[0]}>`);
      }

      try {
        await command.execute(message, args, client);
      } catch (err) {
        console.error(err);
        message.reply("❌ Error running command");
      }

      return;
    }

    // REWARD SYSTEM
    if (!REWARD_CHANNELS.includes(message.channel.id)) return;

    const IGNORED = ['?', '!', '£', '$'];
    if (IGNORED.some(p => message.content.startsWith(p))) return;
    if (message.content.length < 3) return;

    const userId = message.author.id;
    const now = Date.now();

    const last = userLastMessage.get(userId) || 0;
    if (now - last < 2000) return;
    userLastMessage.set(userId, now);

    const lastReward = userRewardCooldown.get(userId) || 0;
    if (now - lastReward < 120000) return;

    const count = db.incrementMessage(userId);

    if (count >= 20) {
      db.addCoins(userId, 15);
      userRewardCooldown.set(userId, now);

      message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2ecc71)
            .setDescription(`💬 ${message.author} earned **15 coins**!`)
        ]
      });
    }
  });

  client.login(TOKEN);
}

main();
