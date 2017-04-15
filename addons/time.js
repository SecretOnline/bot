const Discord = require('discord.js');

const ScriptAddon = require('../bot/ScriptAddon.js');
const Result = require('../bot/Result.js');
const {ReAction} = Result;

const {resolveMentions} = require('../util');

const listLink = 'https://wikipedia.org/wiki/List_of_tz_database_time_zones#List';

const setTimeHelp = {
  text: [
    'syntax: `~set-time <timezone>`',
    'the timezone must be in `Country/City` or `Continent/Country or State/City` format, from the list below',
    'the `Etc/GMT` timezones are not supported'
  ],
  actions: [
    {emoji: 'clock7', desc: 'view a list of timezone names (use the TZ column)', action: listLink}
  ]
};
const getTimeHelp = [
  'syntax: `~time [user]`',
  'gets the time for a user based on the timezone they have set',
  'if no user is given, it uses your time'
];

class Time extends ScriptAddon {
  constructor(bot) {
    super(bot, 'time');
  }

  get description() {
    return 'Performs time-based functions';
  }

  init() {
    this.addCommand('set-time', this.setTime, setTimeHelp);
    this.addCommand('time', this.getTime, getTimeHelp);
  }

  setTime(input) {
    return input.process()
      .then((res) => {
        let conf = this.getUser(input.user);

        let tz = res.args[0];
        if (!tz) {
          let r = new Result(true);
          r.add('no timezone was given');
          r.add(new ReAction('clock7', 'view a list of timezone names (use the TZ column). Note: only `Continent/City` or `Continent/Country or State/City` zones work', input, listLink));

          return r;
        }

        // Test the timezone before going anywhere
        // If it's invalid, the toLocaleTimeString will throw
        try {
          new Date().toLocaleTimeString('en-US', {timeZone:tz});
        } catch (err) {
          let r = new Result(true);
          r.add(`${tz} is not a valid timezone`);
          r.add(new ReAction('clock7', 'view a list of timezone names (use the TZ column). Note: only `Continent/City` or `Continent/Country or State/City` zones work', input, listLink));

          return r;
        }

        conf.tz = tz;
        return this.setUser(conf, input.user)
          .then(() => {
            return `changed your timezone to ${tz}`;
          });
      });
  }

  getTime(input) {
    return input.process()
      .then((res) => {
        let user;

        if (res.args.length) {
          let args = resolveMentions(res.args, input);

          if (args[0] instanceof Discord.User || args[0] instanceof Discord.GuildMember) {
            user = args[0];
          } else {
            throw 'you must mention a user, or leave the rest of the message blank to get your own time';
          }
        } else {
          user = input.user;
        }

        let conf = this.getUser(user);
        if (conf.tz) {
          return `the time for ${user} is ${new Date().toLocaleTimeString('en-US', {timeZone:conf.tz})}`;
          // do time stuff
        } else {
          if (user.id === input.user.id) {
            throw 'you have not added your timezone. use `~set-time <timezone>` to use `~time`';
          }
          throw `${user.toString()} has not set their time`;
        }
      });
  }
}

module.exports = Time;
