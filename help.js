module.exports = {
  name: 'help',
  adminOnly: false,
  ownerOnly: false,

  async execute(message, args, client) {
    const commands = client.commands;

    const list = [...commands.values()]
      .map(cmd => `• £${cmd.name}`)
      .join('\n');

    return message.reply(
      `📜 **Available Commands**\n\n${list}\n\n💡 Use £<command> to run a command`
    );
  },
};
