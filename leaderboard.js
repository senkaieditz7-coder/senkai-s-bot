const { EmbedBuilder } = require('discord.js');
const db = require('./database');

const MEDALS = ['🥇', '🥈', '🥉'];

module.exports = {
  name: 'leaderboard',
  adminOnly: false,
  ownerOnly: false,

  async execute(message) {
    const top = db.getLeaderboard(10);

    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle('🏆 Coin Leaderboard')
      .setTimestamp();

    if (!top || top.length === 0) {
      embed.setDescription('No one has any coins yet!');
      return message.reply({ embeds: [embed] });
    }

    const lines = await Promise.all(
      top.map(async (row, i) => {
        const medal = MEDALS[i] || `**${i + 1}.**`;

        let username = `<@${row.user_id}>`;

        try {
          const member = await message.guild.members.fetch(row.user_id).catch(() => null);
          if (member) username = member.displayName;
        } catch (err) {
          // ignore errors
        }

        return `${medal} ${username} — **${Number(row.coins).toLocaleString()}** coins`;
      })
    );

    embed.setDescription(lines.join('\n'));

    return message.reply({ embeds: [embed] });
  },
};
