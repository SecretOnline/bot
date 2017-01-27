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

    throw 'message manipulation will not work until further work is done';

    this.rmMessageCache = new Map();
  }

  init() {

    this.addCommand('rm', this.doRm, rmHelp);
    this.addCommand('keep', this.doKeep, keepHelp);
    this.addCommand('rm-mode', this.changeMode, Command.PermissionLevels.ADMIN, rmModeHelp);
  }

  doRm(input) {
    let toDelete = false;
    let conf = this.getConfig(input.message.guild);

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
    let conf = this.getConfig(input.message.guild);

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

  changeMode(input) {
    return new Promise((resolve, reject) => {
      let conf = this.getConfig(input.message.guild);
      if (!conf) {
        conf = {};
      }
      let out;

      conf.rmMode = !conf.rmMode;
      if (conf.rmMode) {
        out = 'messages with commands will now be removed once finished';
      } else {
        out = 'messages with commands will be kept after processed';
      }

      this.setConfig(conf, input.message.guild);
      resolve(out);
    });
  }

  onMessage(message, processed) {
    if (!processed) {
      return;
    }

    let toDelete = false;
    let conf = this.getConfig(message.guild);

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
