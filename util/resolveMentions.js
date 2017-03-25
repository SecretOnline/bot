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
      let id = item.match(userMention);

      // User server member list if available
      let userList;
      if (input.channel.guild) {
        userList = input.channel.guild.members;
      } else {
        userList = discord.users;
      }

      if (userList.has(id)) {
        return userList.get(id);
      }
    } else 
    // Test for role mentions
    if (roleMention.test(item)) {
      let id = item.match(roleMention);
      let guild = input.channel.guild;

      // If there's no guild, return original string
      if (!guild) {
        return item;
      }

      if (guild.roles.has(id)) {
        return guild.roles.get(id);
      }
    } else 
    // Test for channel mentions
    if (channelMention.test(item)) {
      let id = item.match(channelMention);
      
      if (discord.channels.has(id)) {
        return discord.channels.get(id);
      }
    } 
    // Default: just return the original string
    else {
      return item;
    }
  });
}

module.exports = resolveMentions;
