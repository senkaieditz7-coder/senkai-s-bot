const db = require('./database');

module.exports = {
  name: 'resetinventory',
  adminOnly: true,
  ownerOnly: false,

  async execute(message, args) {
    const target = message.mentions.users.first();

    if (!target) {
      return message.reply('❌ Please mention a user. Usage: `£resetinventory @user`');
    }

    db.resetInventory(target.id);

    await message.reply(`✅ Inventory cleared for ${target.tag}.`);
  },
};
