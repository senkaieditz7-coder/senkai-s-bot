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
const http = require('http');
const db = require('./database');
const { BOXES, rollReward, getRewardLabel } = require('./boxes');

// Keep-alive HTTP server — prevents Replit from sleeping the process
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('OK');
}).listen(PORT, () => {
  console.log(`Keep-alive server listening on port ${PORT}`);
});

const TOKEN = process.env.DISCORD_BOT_TOKEN;
if (!TOKEN) {
  console.error('ERROR: DISCORD_BOT_TOKEN environment variable is not set.');
  process.exit(1);
}

const PREFIX = '£';
const COMMAND_CHANNELS = ['1492918524878786563', '1492918525105275033'];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

const MESSAGE_REWARD_AMOUNT = 15;
const MESSAGES_NEEDED = 20;
const SPAM_COOLDOWN_MS = 2000;
const REWARD_COOLDOWN_MS = 120 * 1000;
const userLastMessage = new Map();
const userRewardCooldown = new Map();

async function main() {
  await db.init();

  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (command.name && command.execute) {
      client.commands.set(command.name, command);
    }
  }

  client.once(Events.ClientReady, () => {
    console.log(`Bot is online as ${client.user.tag}`);
    console.log(`Serving ${client.guilds.cache.size} guild(s)`);
    console.log(`Loaded ${client.commands.size} commands (prefix: ${PREFIX})`);
  });

  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    if (!message.guild) return;

    const OWNER_ID = process.env.BOT_OWNER_ID;

    if (OWNER_ID && message.author.id === OWNER_ID && message.content === 'Hi kids') {
      return message.reply('Hi Master! Was it a hardworking day! Keep up the good work :)');
    }

    if (message.content.startsWith(PREFIX)) {
      const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
      const commandName = args.shift().toLowerCase();

      const command = client.commands.get(commandName);
      if (!command) return;

      const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator);

      if (!COMMAND_CHANNELS.includes(message.channel.id) && !isAdmin) {
        const channelMentions = COMMAND_CHANNELS.map(id => `<#${id}>`).join(' or ');
        return message.reply(`❌ Please use bot commands in the bot-commands channel → ${channelMentions}`);
      }

      if (command.adminOnly && !isAdmin) {
        return message.reply('❌ You need Administrator permission to use this command.');
      }

      if (command.ownerOnly && message.author.id !== OWNER_ID) {
        return message.reply('❌ Only the bot owner can use this command.');
      }

      try {
        await command.execute(message, args, client);
      } catch (err) {
        console.error(`Error executing ${PREFIX}${commandName}:`, err);
        message.reply('❌ An error occurred while running this command.').catch(() => {});
      }
      return;
    }

    const REWARD_CHANNELS = ['1492918525105275032', '1492918524367343853'];
    const IGNORED_PREFIXES = ['?', '!', '£', '$', 'c!', '\u201c', '\u201d', 'owo.'];

    if (!REWARD_CHANNELS.includes(message.channel.id)) return;

    const msgLower = message.content.toLowerCase();
    if (IGNORED_PREFIXES.some(p => msgLower.startsWith(p.toLowerCase()))) return;

    const userId = message.author.id;
    const now = Date.now();

    const lastTime = userLastMessage.get(userId) || 0;
    if (now - lastTime < SPAM_COOLDOWN_MS) return;
    userLastMessage.set(userId, now);

    const rewardCooldownSince = userRewardCooldown.get(userId) || 0;
    if (now - rewardCooldownSince < REWARD_COOLDOWN_MS) return;

    const count = db.incrementMessage(userId);
    if (count >= MESSAGES_NEEDED) {
      db.addCoins(userId, MESSAGE_REWARD_AMOUNT);
      db.setLastMessageReward(userId, now);
      userRewardCooldown.set(userId, now);

      try {
        await message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(0x2ecc71)
              .setDescription(`💬 ${message.author} reached **${MESSAGES_NEEDED} messages** and earned **${MESSAGE_REWARD_AMOUNT} coins**!`)
          ],
        });
      } catch {}
    }
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'resetcoins_confirm') {
      db.resetAllCoins();
      return interaction.update({
        content: '⚠️ All user coins have been reset.',
        components: [],
      });
    }

    if (interaction.customId === 'resetcoins_cancel') {
      return interaction.update({
        content: '✅ Reset cancelled. No coins were changed.',
        components: [],
      });
    }

    const boxMap = {
      buy_rare: 'rare',
      buy_premium: 'premium',
      buy_luxury: 'luxury',
    };

    const boxKey = boxMap[interaction.customId];
    if (!boxKey) return;

    const box = BOXES[boxKey];
    const userId = interaction.user.id;
    const balance = db.getBalance(userId);

    if (balance < box.cost) {
      const embed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle('❌ Insufficient Coins')
        .setDescription(`You need **${box.cost} coins** to open the ${box.emoji} **${box.name}**.\nYou only have **${balance.toLocaleString()} coins**.`)
        .setFooter({ text: `Earn more with ${PREFIX}daily or by chatting!` });
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const removed = db.removeCoins(userId, box.cost);
    if (!removed) {
      return interaction.reply({ content: 'Transaction failed. Try again.', ephemeral: true });
    }

    const reward = rollReward(boxKey);

    if (reward.type === 'coins') {
      db.addCoins(userId, reward.amount);
    } else if (reward.type === 'item') {
      db.addItem(userId, reward.name);
    }

    const finalBalance = db.getBalance(userId);

    const embed = new EmbedBuilder()
      .setColor(box.color)
      .setTitle(`${box.emoji} ${box.name} Opened!`)
      .setDescription(`You spent **${box.cost} coins** and received...\n\n🎊 **${getRewardLabel(interaction.client, reward)}**!`)
      .addFields(
        { name: 'Previous Balance', value: `${balance.toLocaleString()} coins`, inline: true },
        { name: 'New Balance', value: `${finalBalance.toLocaleString()} coins`, inline: true }
      )
      .setFooter({ text: interaction.user.username })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  });

  client.on('error', err => console.error('Discord client error:', err));
  client.on('warn', msg => console.warn('Discord warning:', msg));
  client.on(Events.ShardDisconnect, () => console.log('Bot disconnected — discord.js will auto-reconnect.'));
  client.on(Events.ShardReconnecting, () => console.log('Bot reconnecting...'));
  client.on(Events.ShardResume, () => console.log('Bot reconnected and resumed.'));

  await client.login(TOKEN);
}

process.on('unhandledRejection', err => {
  console.error('Unhandled rejection:', err);
});

process.on('uncaughtException', err => {
  console.error('Uncaught exception:', err);
});

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
