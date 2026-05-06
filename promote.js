module.exports = {
  name: 'promote',
  adminOnly: true,
  ownerOnly: false,
  async execute(message) {
    const target = message.mentions.members.first();

    if (!target) return message.reply('❌ Please mention a user. Usage: `£promote @user`');

    const botMember = message.guild.members.me;
    const botHighestPosition = botMember.roles.highest.position;

    const manageableRoles = [...message.guild.roles.cache.values()]
      .filter(r => r.id !== message.guild.id && r.position < botHighestPosition)
      .sort((a, b) => a.position - b.position);

    const memberHighestRole = target.roles.cache
      .filter(r => r.id !== message.guild.id)
      .sort((a, b) => b.position - a.position)
      .first();

    if (!memberHighestRole) return message.reply('❌ No higher role, failed.');

    const currentIndex = manageableRoles.findIndex(r => r.id === memberHighestRole.id);
    const nextRole = manageableRoles[currentIndex + 1];

    if (!nextRole || currentIndex === -1) return message.reply('❌ No higher role, failed.');

    try {
      await target.roles.remove(memberHighestRole);
      await target.roles.add(nextRole);
      await message.reply(`✅ ${target} has been promoted from **${memberHighestRole.name}** to **${nextRole.name}**.`);
    } catch (err) {
      console.error('Promote error:', err);
      await message.reply('❌ Failed to update roles. Check bot permissions.');
    }
  },
};
