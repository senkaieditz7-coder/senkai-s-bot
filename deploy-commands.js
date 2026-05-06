const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error('ERROR: DISCORD_BOT_TOKEN and DISCORD_CLIENT_ID must be set.');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command.data) {
    commands.push(command.data.toJSON());
    console.log(`Loaded command: /${command.data.name}`);
  }
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log(`Registering ${commands.length} slash commands globally...`);
    const data = await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log(`Successfully registered ${data.length} commands.`);
  } catch (err) {
    console.error('Failed to register commands:', err);
    process.exit(1);
  }
})();
