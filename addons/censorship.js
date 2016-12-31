const fs = require('fs');
const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');

const blacklistHelp = [
  'syntax: `~censor-blacklist-<add/remove> <\\\`expression\\\`>`',
  'allows the bot to remove messages if they match a regular expression',
  'for help on expressions, type `~help topic regex`',
  'messages may appear on user\'s screen before they are removed',
  'there is nothing that secret_bot can do about this'
];
const showLinksHelp = [
  'syntax `~show-links <id>`',
  'if secret_bot removes your message because it contains links, then other users can use `~show-links` to view them',
  'secret_bot does not remove links by default',
  'this is a configured feature that is only used if enabled by a server admin',
  'links are stored for 30 minutes before being removed from secret_bot'
];
const linkFilterHelp = [
  'syntax: `~censor-links-<add/remove/reset> [\\\`user id\\\`]`',
  'removes messages from certain users if those messages contain links',
  'secret_bot then replies with a message explaining how to view those links',
  'running `~censor-links-add all` will turn this on for all users, rather than individuals',
  'messages from bots do not get removed',
  '`~censor-links-reset` will remove all users from the list, essentially disabling this feature for your server'
];

class Censor extends ScriptAddon {
  constructor(bot) {
    super(bot, 'core');

    this.censor = {};
    this.conf.path = this.conf.path || 'censor.conf.json';
    this.f = undefined;
    this.linkMap = new Map();

    fs.readFile(`./${this.conf.path}`, 'utf8', (err, data) => {
      try {
        this.censor = JSON.parse(data);
      } catch (e) {
        this.censor = {};
        fs.writeFile(this.conf.path, JSON.stringify(this.censor, null, 2), () => {});
        return;
      }
    });
  }

  init() {
    this.f = this.onMessage.bind(this); // Yay for binding! /s
    this.bot.requestAllMessages(this.f);
    // TODO
    this.bot.addCommand('censor-blacklist-add', new Command(this.addToBlacklist.bind(this), 'censor.blacklist', Command.PermissionLevels.ADMIN), blacklistHelp);
    this.bot.addCommand('censor-blacklist-remove', new Command(this.removeFromBlacklist.bind(this), 'censor.blacklist', Command.PermissionLevels.ADMIN), blacklistHelp);
    this.bot.addCommand('show-links', new Command(this.showLinks.bind(this), 'censor.links'), showLinksHelp);
    this.bot.addCommand('censor-links-add', new Command(this.addToLinkFilter.bind(this), 'censor.links', Command.PermissionLevels.ADMIN), linkFilterHelp);
    this.bot.addCommand('censor-links-remove', new Command(this.removeFromLinkFilter.bind(this), 'censor.links', Command.PermissionLevels.ADMIN), linkFilterHelp);
    this.bot.addCommand('censor-links-reset', new Command(this.resetLinkFilter.bind(this), 'censor.links', Command.PermissionLevels.ADMIN), linkFilterHelp);
  }

  deinit() {
    this.bot.cancelAllMessages(this.f);
  }

  addToBlacklist(input) {
    return new Promise((resolve, reject) => {
      let exp = input.text.match(/`(.*)`/);
      if (!exp) {
        reject('you must enclose the regular expression in back quotes "\\`"\ntype `~help topic regex` for help with regular expressions');
        return;
      }

      if (!this.censor[input.message.connection.id]) {
        this.censor[input.message.connection.id] = {};
      }
      if (!this.censor[input.message.connection.id][input.message.channel.server.id]) {
        this.censor[input.message.connection.id][input.message.channel.server.id] = {};
      }
      if (!this.censor[input.message.connection.id][input.message.channel.server.id].blacklist) {
        this.censor[input.message.connection.id][input.message.channel.server.id].blacklist = [];
      }

      this.censor[input.message.connection.id][input.message.channel.server.id].blacklist.push(exp[1]);

      fs.writeFile(this.conf.path, JSON.stringify(this.censor, null, 2), (err) => {
        if (err) {
          reject('unable to write to file, changes may be lost');
          return;
        }
        reject(`added \`${exp[1]}\` to blacklist`);
      });
    });
  }

  removeFromBlacklist(input) {
    return new Promise((resolve, reject) => {
      let exp = input.text.match(/`(.*)`/);
      if (!exp) {
        reject('you must enclose the regular expression in back quotes "\\`"\ntype `~help topic regex` for help with regular expressions');
        return;
      }

      if (!this.censor[input.message.connection.id]) {
        this.censor[input.message.connection.id] = {};
      }
      if (!this.censor[input.message.connection.id][input.message.channel.server.id]) {
        this.censor[input.message.connection.id][input.message.channel.server.id] = {};
      }

      let serverConf = this.censor[input.message.connection.id][input.message.channel.server.id];
      if (!serverConf.blacklist) {
        serverConf.blacklist = [];
      }
      let list = serverConf.blacklist;

      if (!serverConf.blacklist.length) {
        reject('there is nothing in the blacklist at the moment');
        return;
      }

      let index = list.indexOf(exp[1]);

      if (index < 0) {
        reject(`\`${exp[1]}\` wasn't in the blacklist`);
        return;
      }

      list.splice(index, 1);

      fs.writeFile(this.conf.path, JSON.stringify(this.censor, null, 2), (err) => {
        if (err) {
          reject('unable to write to file, changes may be lost');
          return;
        }
        reject(`removed \`${exp[1]}\` from blacklist`);
      });
    });
  }

  showLinks(input) {
    if (this.linkMap.has(input.text)) {
      input.user.send(`message: ${this.linkMap.get(input.text)}`);
    } else {
      input.user.send(`unable to find links with an id of \`${input.text}\``);
    }
  }

  addToLinkFilter(input) {
    return new Promise((resolve, reject) => {
      let id = input.text.match(/(?:<@!?)?(\d+)>?/)[1];
      if (!id) {
        reject('you must enclose the user\'s id in back quotes "\\`"');
        return;
      }

      if (!this.censor[input.message.connection.id]) {
        this.censor[input.message.connection.id] = {};
      }
      if (!this.censor[input.message.connection.id][input.message.channel.server.id]) {
        this.censor[input.message.connection.id][input.message.channel.server.id] = {};
      }

      let serverConf = this.censor[input.message.connection.id][input.message.channel.server.id];
      if (!serverConf.links) {
        serverConf.links = {};
      }
      if (!serverConf.links.users) {
        serverConf.links.users = [];
      }

      if (id === 'all') {
        serverConf.links.all = true;
      } else {
        serverConf.links.users.push(id);
      }

      fs.writeFile(this.conf.path, JSON.stringify(this.censor, null, 2), (err) => {
        if (err) {
          reject('unable to write to file, changes may be lost');
          return;
        }
        reject(`added \`${id}\` to the links filtering`);
      });
    });
  }

  removeFromLinkFilter(input) {
    return new Promise((resolve, reject) => {
      let id = input.text.match(/(?:<@!?)?(\d+)>?/)[1];
      if (!id) {
        reject('you must enclose the user\'s id in back quotes "\\`"');
        return;
      }

      if (!this.censor[input.message.connection.id]) {
        this.censor[input.message.connection.id] = {};
      }
      if (!this.censor[input.message.connection.id][input.message.channel.server.id]) {
        this.censor[input.message.connection.id][input.message.channel.server.id] = {};
      }

      let serverConf = this.censor[input.message.connection.id][input.message.channel.server.id];
      if (!serverConf.links) {
        serverConf.links = {};
      }
      if (!serverConf.links.users) {
        serverConf.links.users = [];
      }

      if (id === 'all') {
        serverConf.links.all = false;
      } else {
        let list = serverConf.links.users;
        let index = list.indexOf(id);

        if (index < 0) {
          reject(`\`${id}\` wasn't in the links filter`);
          return;
        }

        list.splice(index, 1);
        serverConf.links.users.push(id);
      }

      fs.writeFile(this.conf.path, JSON.stringify(this.censor, null, 2), (err) => {
        if (err) {
          reject('unable to write to file, changes may be lost');
          return;
        }
        reject(`removed \`${id}\` from links filtering`);
      });
    });
  }

  resetLinkFilter(input) {
    return new Promise((resolve, reject) => {
      if (!this.censor[input.message.connection.id]) {
        this.censor[input.message.connection.id] = {};
      }
      if (!this.censor[input.message.connection.id][input.message.channel.server.id]) {
        this.censor[input.message.connection.id][input.message.channel.server.id] = {};
      }

      let serverConf = this.censor[input.message.connection.id][input.message.channel.server.id];

      serverConf.links = {
        all: false,
        users: []
      };


      fs.writeFile(this.conf.path, JSON.stringify(this.censor, null, 2), (err) => {
        if (err) {
          reject('unable to write to file, changes may be lost');
          return;
        }
        reject('link filter has been reset, no links are removed');
      });
    });
  }

  onMessage(message) {
    switch (message.connection.id) {
      case 'djs':
        this.onMessageDiscord(message);
        break;
    }
  }

  onMessageDiscord(message) {
    if (!message.channel.server) {
      return;
    }
    if (message.original.author.bot) {
      return;
    }

    if (this.censor[message.channel.connection.id]) {
      if (this.censor[message.channel.connection.id][message.channel.server.id]) {
        let conf = this.censor[message.channel.connection.id][message.channel.server.id];

        if (conf.blacklist) {
          let remove = conf.blacklist.reduce((prev, str) => {
            if (prev) {
              return prev;
            }

            let exp = new RegExp(str, 'i');
            if (message.text.match(exp)) {
              return true;
            }

            return false;
          }, false);

          if (remove) {
            if (message.original.deletable) {
              message.original.delete();
            } else {
              console.error(`[CENSOR] can't delete message in ${message.channel.connection.id}.${message.channel.server.id}`); // eslint-disable-line no-console
            }
          }
        }

        if (conf.links && (conf.links.all || conf.links.users.includes(message.user.id))) {
          let linkExp = /(\w+:\/\/\S+\.\S+)/ig;
          let match = message.text.match(linkExp);

          if (match) {
            let id = message.original.id;
            let domains = match.map((l) => {
              return l.match(/\/\/((?:\w+\.?)+)\/?.*$/)[1];
            });

            this.linkMap.set(id, message.text);
            setTimeout(() => {
              this.linkMap.delete(id);
            }, 1800000);


            if (message.original.deletable) {
              message.original.delete();
              message.channel.send(`${message.user.mention()}'s message contained ${domains.length > 1 ? 'links' : 'a link'} from ${domains.join(' , ')}. use \`~show-links ${id}\` to see the message (use copy/paste). this will be stored for 30 minutes`);
            } else {
              console.error(`[CENSOR] can't delete message in ${message.channel.connection.id}.${message.channel.server.id}`); // eslint-disable-line no-console
            }
          }
        }
      }
    }
  }
}

module.exports = Censor;
