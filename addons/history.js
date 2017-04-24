const Discord = require('discord.js');

const ScriptAddon = require('../bot/ScriptAddon.js');
const Logger = require('../bot/Logger.js');

const {truncate} = require('../util');

const historyHelp = [
  'syntax: `~history <number-of-messages> [user-mention]`',
  'gets the last <number> messages spoken in this channel',
  'adding a user mention filters to messages said by that person'
];

class History extends ScriptAddon {
  constructor(bot) {
    super(bot, 'history');

    this.desc  = 'Allows the browsing of the chat history in a server';
  }

  init() {
    this.addCommand('history', this.getHistory, historyHelp);
  }

  getHistory(input) {
    let length = 10;
    if (!input.args.length) {
      throw 'no number of messages given';
    }

    if (!input.args[0].match(/^\d+$/)) {
      throw `${input.args[0]} is not a number`;
    }

    let num = Number.parseInt(input.args[0]);
    if (num < 0) {
      throw 'must have a positive number of messages to retrieve';
    }
    if (num > 10) {
      num = 10;
    }
    length = num;

    let filter;
    if (input.message.mentions.users.size) {
      let user = input.message.mentions.users.first();
      let channel = input.message.channel;
      filter = (line) => {
        if (line.type !== 'message') {
          return false;
        }
        if (line.author !== user.id) {
          return false;
        }
        if (line.channel !== channel.id) {
          return false;
        }

        return true;
      };
    } else {
      filter = Logger.filterByChannel(input.message.channel);
    }

    return this.bot.getLogs(filter, length)
      .then((lines) => {
        let plural = length > 1;
        let embed = new Discord.RichEmbed()
          .setTitle(`Last ${plural?`${length} `:''}message${plural?'s':''}`)
          .setColor('#F1C40F');

        lines.forEach((line) => {
          let text;
          if (line.embed) {
            if (line.message) {
              text = `${line.message} {embed}`;
            } else {
              text = '{embed}';
            }
          } else {
            text = line.message;
          }
          embed.addField(line.username, truncate(text, 80), true);
        });

        return embed;
      });
  }
}

module.exports = History;
