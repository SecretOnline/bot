const fs = require('fs');
const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');

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
    this.bot.addCommand('censor-blacklist-add', new Command(this.addToBlacklist.bind(this), 'censor.blacklist', Command.PermissionLevels.ADMIN));
    this.bot.addCommand('censor-blacklist-remove', new Command(this.removeFromBlacklist.bind(this), 'censor.blacklist', Command.PermissionLevels.ADMIN));
    this.bot.addCommand('show-links', new Command(this.showLinks.bind(this), 'censor.links'));
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

      if (!(
        this.censor[input.message.connection.id] &&
        this.censor[input.message.connection.id][input.message.channel.server.id] &&
        this.censor[input.message.connection.id][input.message.channel.server.id].blacklist &&
        this.censor[input.message.connection.id][input.message.channel.server.id].blacklist.length
      )) {
        reject('no words configured in the blacklist');
        return;
      }
      let list = this.censor[input.message.connection.id][input.message.channel.server.id].blacklist;
      let index = list.indexOf(exp[1]);

      if (index < 0) {
        reject(`\`${exp[1]}\` wasn't in the blacklist`);
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
      input.user.send(`links: ${this.linkMap.get(input.text)}`);
    } else {
      input.user.send(`unable to find links with an id of \`${input.text}\``);
    }
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
              console.error(`[CENSOR] can't delete message in ${message.channel.connection.id}.${message.channel.server.id}`);
            }
          }
        }

        if (conf.links && (conf.links.all || conf.links.users.includes(message.user.id))) {
          let linkExp = /(\w+:\/\/\S+\.\S+)/ig;
          let match = message.text.match(linkExp);

          if (match) {
            let id = message.original.id;
            let str = match.join(' ');

            this.linkMap.set(id, str);
            setTimeout(function () {
              this.linkMap.delete(id);
            }, 1800000);


            if (message.original.deletable) {
              message.original.delete();
              message.channel.send(`${message.user.mention()}'s message contained a link. use \`~show-links ${id}\` to see them`);
            } else {
              console.error(`[CENSOR] can't delete message in ${message.channel.connection.id}.${message.channel.server.id}`);
            }
          }
        }
      }
    }
  }
}

module.exports = Censor;
