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

const TOKEN = process.env.TOKEN;

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

const MESSAGE_REWARD_AMOUNT = 15;
const MESSAGES_NEEDED = 20;
const SPAM_COOLDOWN_MS = 2000;
const REWARD_COOLDOWN_MS = 120000;

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

async function main() {
  await db.init();

  // LOAD COMMANDS
  const commandsPath = path.join(__dirname, 'commands');
  if (fs.existsSync(commandsPath)) {
    const files = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

    for (const file of files) {
      const cmd = require(path.join(commandsPath, file));
      if (cmd.name && cmd.execute) {
        client.commands.set(cmd.name, cmd);
      }
    }
  }

  // READY EVENT
  client.once(Events.ClientReady, () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
  });

  // MESSAGE EVENT
  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.guild) return;

    const isAdmin = message.member?.permissions?.has(
      PermissionsBitField.Flags.Administrator
    );

    // OWNER COMMAND
    if (message.author.id === OWNER_ID && message.content === 'Hi kids') {
      return message.reply('Hi Master! Was it a hardworking day! Keep up the good work :)');
    }

    // PREFIX COMMANDS
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
        console.error(err);
        message.reply('❌ Error running command.');
      }

      return;
    }

    // REWARD SYSTEM
    if (!REWARD_CHANNELS.includes(message.channel.id)) return;

    const IGNORED_PREFIXES = ['?', '!', '£', '$'];
    if (IGNORED_PREFIXES.some(p => message.content.startsWith(p))) return;

    if (message.content.length < 3) return;

    const userId = message.author.id;
    const now = Date.now();

    // SPAM CHECK
    const last = userLastMessage.get(userId) || 0;
    if (now - last < SPAM_COOLDOWN_MS) return;
    userLastMessage.set(userId, now);

    // REWARD COOLDOWN
    const lastReward = userRewardCooldown.get(userId) || 0;
    if (now - lastReward < REWARD_COOLDOWN_MS) return;

    const count = db.incrementMessage(userId);

    if (count >= MESSAGES_NEEDED) {
      db.addCoins(userId, MESSAGE_REWARD_AMOUNT);
      userRewardCooldown.set(userId, now);

      await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2ecc71)
            .setDescription(
              `💬 ${message.author} earned **${MESSAGE_REWARD_AMOUNT} coins**!`
            ),
        ],
      });
    }
  });

  client.on('error', console.error);

  // IMPORTANT: no await here
  client.login(TOKEN);
}

main();
