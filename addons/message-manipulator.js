const fs = require('fs');
const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');

let rmHelp = [
  'just put `~rm` anywhere in your message, and s_b will remove your message, but still send a reply',
  'server admins can configure this to be the default behaviour with `~rm-mode`. use `~help rm-mode` for more information'
];
let mkHelp = [
  'put `~keep` anywhere in your message, and s_b will *not* remove your message, and will still send a reply',
  'this is secret_bot\'s default behaviour, but that can be changed with `~rm-mode`. use `~help rm-mode` for more information'
];
let rmModeHelp = [

];

// Store removing/removed message IDs in cache for up-to 1 minute
let cacheStoreTime = 60 * 1000;

class MessMan extends ScriptAddon {
  constructor(bot) {
    super(bot, 'messages');

    this.mConf = {};
    this.rmMessageCache = new Map();
    this.conf.path = this.conf.path || 'messages.conf.json';
    this.timeout;

    fs.readFile(`./${this.conf.path}`, 'utf8', (err, data) => {
      try {
        this.mConf = JSON.parse(data);
      } catch (e) {
        this.mConf = {};
        fs.writeFile(this.conf.path, JSON.stringify(this.mConf, null, 2), () => {});
        return;
      }
    });
  }

  init() {
    this.f = this.onMessage.bind(this); // Yay for binding! /s
    this.bot.requestAllMessages(this.f, true);

    this.bot.addCommand('rm', new Command(this.doRm.bind(this), 'discord.messages', rmHelp));
    // this.bot.addCommand('mk', new Command(this.doMk.bind(this), 'discord.messages'));
    // this.bot.addCommand('rm-mode', new Command(this.changeMode.bind(this), 'discord.messages'), Command.PermissionLevels.DEFAULT);
  }

  deinit() {
    this.bot.cancelAllMessages(this.f);
  }

  doRm(input) {
    this.rmMessageCache.set(input.message.id, setTimeout(() => {
      if (this.rmMessageCache.has(input.message.id)) {
        this.rmMessageCache.delete(input.message.id);
      }
    }, cacheStoreTime));

    // Output nothing
    return input.process();
  }

  onMessage(message) {
    let toDelete = false;
    let conf = this.mConf[message.guild.id];

    if (conf && conf.rmMode) {
      if (!this.rmMessageCache.has(message.id)) {
        toDelete = true;
      }
    } else {
      if (this.rmMessageCache.has(message.id)) {
        toDelete = true;
      }
    }

    if (toDelete) {
      this.rmMessageCache.delete(message.id);
      if (message.deletable) {
        message.delete()
          .catch(() => {
            this.error(`failed to delete message ${message.id}`);
          });
      }
    }
  }
}

module.exports = MessMan;
