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
        this.commands = JSON.parse(data);
      } catch (e) {
        this.commands = {};
        fs.writeFile(this.conf.path, JSON.stringify(this.censor, null, 2));
        return;
      }
    });
  }

  init() {
    this.f = this.onMessage.bind(this); // Yay for binding! /s
    this.bot.requestAllMessages(this.f);
    // TODO
    // Add commands
  }

  deinit() {
    this.bot.cancelAllMessages(this.f);
  }

  onMessage(message) {
    if (this.censor[message.channel.connection.id]) {
      if (this.censor[message.channel.server.id]) {
        let conf = this.censor[message.channel.server.id];

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
            console.log('would remove');
          }
        }
      }
    }
  }
}

module.exports = Censor;
