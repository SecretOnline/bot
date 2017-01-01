/**
 * An addon. Generally manages commands
 * Should be extended by addons
 */
class Addon {
  constructor(bot, namespace = 'NONAME') {
    this.bot = bot;
    this.ns = namespace;
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

  log(message) {
    return this.bot.log(message, this);
  }

  error(message) {
    return this.bot.error(message, this);
  }
}

module.exports = Addon;
