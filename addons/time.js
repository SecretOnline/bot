const Discord = require('discord.js');

const ScriptAddon = require('../bot/ScriptAddon.js');

const {resolveMentions} = require('../util');

const setTimeHelp = [
  'syntax: `~set-time `'
];

class Time extends ScriptAddon {
  constructor(bot) {
    super(bot, 'time');
  }

  get description() {
    return 'Performs time-based functions';
  }

  init() {

  }

  setTime(input) {
    input.process()
      .then((res) => {
        let user = input.user;
        let conf = this.getConfig(input.channel.guild);

        
      });
  }

  getTime(input) {
    input.process()
      .then((res) => {
        let user;

        if (res.args.length) {
          let args = resolveMentions(res.args, input);

          if (args[0] instanceof Discord.User || args[0] instanceof Discord.GuildMember) {
            user = args[0];
          } else {
            throw 'you must mention a user, or leave the rest of the mssage blank to get your own time';
          }
        } else {
          user = input.user;
        }
        

        let conf = this.getConfig(input.channel.guild);
        if (conf[user.id]) {
          // do time stuff
        } else {
          if (user.id === input.user.id) {
            throw 'you have not added your timezone. use `~set-time +/-hours` to use `~time`';
          }
          throw `${user.toString()} has not set their time`;
        }
      });
  }
}

module.exports = Time;
