/**
 * An addon. Generally manages commands
 * Should be extended by addons
 */
class Addon {
  constructor(bot, config = {}, namespace = 'NONAME') {
    this.bot = bot;
    this.conf = config;
    this.ns = namespace;
    this.commands = new Map();
  }

  get namespace() {
    return this.ns;
  }

  init() {
    return Promise.reject('Addon didn\'t overwrite init');
  }

  deinit() {
    return Promise.reject('Addon didn\'t overwrite deinit');
  }

  _addCommand(trigger, command) {
    if (this.commands.has(trigger)) {
      return false;
    } else {
      this.commands.set(trigger, command);
      return this.bot.addCommand(trigger, command);
    }
  }

  _removeCommand(trigger, command) {
    var comm = this.commands.get(trigger);

    if (comm) {
      if (comm === command) {
        this.commands.delete(trigger);
        return this.bot.removeCommand(trigger, comm);
      } else {
        return false;
      }
    } else {
      return true;
    }
  }
}

module.exports = Addon;
