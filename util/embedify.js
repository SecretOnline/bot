const Discord = require('discord.js');

/**
 * Turns a string into a RichEmbed by making it the description
 *
 * @param {string} str String to embed
 * @param {string} [color] Color to set the embed to
 * @returns
 */
function embedify(str, color) {
  const embed = new Discord.RichEmbed();
  //  .setAuthor('\u200b', this._discord.user.avatarURL);

  // Set embed colour
  if (color) {
    embed.setColor(color);
  }

  // See if message is a link
  // TODO: Possibly
  // Basic url matching regex
  let urlRegex = /(https?:\/\/(?:\w+\.?)+\/?\S*\.(?:jpe?g|png|gif(?!v)))/g;
  let match = str.match(urlRegex);
  if (match) {
    // Use last image in message
    let last = match[match.length - 1];
    embed.setImage(last);

    // If the message more than just that link, put entire message in description
    if (str !== last) {
      // If only message, remove the link
      if (match.length === 1) {
        str = str.replace(match[0], '');
      }
      embed.setDescription(str);
    }
  } else {
    embed.setDescription(str);
  }

  return embed;
}

module.exports = embedify;
