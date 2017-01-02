const fs = require('fs');
const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');

let rmHelp = [
  'just put `~rm` anywhere in your message, and s_b will remove your message, but still send a reply',
  'server admins can configure this to be the default behaviour with `~rm-mode`. use `~help rm-mode` for more information'
];
let keepHelp = [
  'put `~keep` anywhere in your message, and s_b will *not* remove your message, and will still send a reply',
  'this is secret_bot\'s default behaviour, but that can be changed with `~rm-mode`. use `~help rm-mode` for more information'
];
let rmModeHelp = [
  'by default, secret_bot does not touch the messages that give it commands',
  'using this command, you can configure secret_bot to remove those messages',
  '*e.g.*',
  'normally:',
  '```',
  '<secret_online> ~lenny',
  '```',
  'results in',
  '```',
  '<secret_online> ~lenny',
  '<secret_bot> ~bot',
  '```',
  '',
  'with `~rm-mode` active',
  '```',
  '<secret_online> ~lenny',
  '```',
  'results in',
  '```',
  '<secret_bot> ~bot',
  '```'
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

    this.bot.addCommand('rm', new Command(this.doRm.bind(this), 'messages', rmHelp));
    this.bot.addCommand('keep', new Command(this.doKeep.bind(this), 'messages'), keepHelp);
    this.bot.addCommand('rm-mode', new Command(this.changeMode.bind(this), 'messages'), Command.PermissionLevels.ADMIN, rmModeHelp);
  }

  deinit() {
    this.bot.cancelAllMessages(this.f);
  }

  doRm(input) {
    let toDelete = false;
    let message = input.message;
    let conf = this.mConf[message.guild.id];

    // If rm mode is set, don't worry. It'll be taken care of
    if (!(conf && conf.rmMode)) {
      toDelete = true;
    }

    if (toDelete) {
      this.rmMessageCache.set(input.message.id, setTimeout(() => {
        if (this.rmMessageCache.has(input.message.id)) {
          this.rmMessageCache.delete(input.message.id);
        }
      }, cacheStoreTime));
    }

    // Output just whatever was given to this command
    return input.process();
  }

  doKeep(input) {
    let toKeep = false;
    let message = input.message;
    let conf = this.mConf[message.guild.id];

    // If rm mode is set do the thing
    if (conf && conf.rmMode) {
      toKeep = true;
    }

    if (toKeep) {
      this.rmMessageCache.set(input.message.id, setTimeout(() => {
        if (this.rmMessageCache.has(input.message.id)) {
          this.rmMessageCache.delete(input.message.id);
        }
      }, cacheStoreTime));
    }

    // Output just whatever was given to this command
    return input.process();
  }

  onMessage(message) {
    let toDelete = false;
    let conf = this.mConf[message.guild.id];

    if (conf && conf.rmMode) {
      if (this.rmMessageCache.has(message.id)) {
        clearTimeout(this.rmMessageCache.get(message.id));
        this.rmMessageCache.delete(message.id);
      } else {
        toDelete = true;
      }
    } else {
      if (this.rmMessageCache.has(message.id)) {
        clearTimeout(this.rmMessageCache.get(message.id));
        this.rmMessageCache.delete(message.id);
        toDelete = true;
      }
    }

    if (toDelete) {
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
