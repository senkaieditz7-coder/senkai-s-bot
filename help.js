module.exports = {
  name: 'help',
  adminOnly: false,
  ownerOnly: false,

  async execute(message, args, client) {
    const commands = [...client.commands.values()]
      .map(cmd => `£${cmd.name}`)
      .join('\n');

    return message.reply(
      "📜 **Commands List**\n\n" +
      "```yaml\n" +
      commands +
      "\n```"
    );
  },
};
