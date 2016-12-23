const fs = require('fs');
const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');

class Censor extends ScriptAddon {
  constructor(bot) {
    super(bot, 'core');

    this.censor = {};
    this.conf.path = this.conf.path || 'censor.conf.json';
    this.f = undefined;

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
    // this.bot.addCommand('censor-blacklist-remove', new Command(this.removeCommand.bind(this), 'core.custom', Command.PermissionLevels.ADMIN));
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
        resolve('added ');
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
            // TODO: Remove the message
            if (message.original.deletable) {
              message.original.delete();
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
