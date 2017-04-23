const userMention = /<@!?(\d+)>/; // Includes nicknames
const roleMention = /<@&(\d+)>/;
const channelMention = /<#(\d+)>/;

/**
 * Resolves any mentions or other Discord objects in the array
 *
 * @param {Array<string>} array
 * @param {Input} input
 */
function resolveMentions(array, input) {
  let discord = input.bot.discord;

  return array.map((item) => {
    if (userMention.test(item)) {
      let match = item.match(userMention);

      // User server member list if available
      let userList;
      if (input.channel.guild) {
        userList = input.channel.guild.members;
      } else {
        userList = discord.users;
      }

      if (userList.has(match[1])) {
        return userList.get(match[1]);
      }

      return item;
    } else
    // Test for role mentions
    if (roleMention.test(item)) {
      let match = item.match(roleMention);
      let guild = input.channel.guild;

      // If there's no guild, return original string
      if (!guild) {
        return item;
      }

      if (guild.roles.has(match[1])) {
        return guild.roles.get(match[1]);
      }
    } else
    // Test for channel mentions
    if (channelMention.test(item)) {
      let match = item.match(channelMention);

      if (discord.channels.has(match[1])) {
        return discord.channels.get(match[1]);
      }
    }
    // Default: just return the original string

    return item;
  });
}

module.exports = resolveMentions;
