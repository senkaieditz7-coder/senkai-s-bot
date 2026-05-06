function getEmoji(client, name, fallback = '') {
  const emoji = client.emojis.cache.find(e => e.name === name);
  return emoji ? emoji.toString() : fallback;
}

module.exports = { getEmoji };
