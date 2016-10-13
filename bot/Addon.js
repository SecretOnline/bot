/**
 * An addon. Generally manages commands
 * Should be extended by addons
 */
class Addon {
  constructor(bot) {
    this.b = bot;
  }

  init() {
    return Promise.reject('Addon didn\'t overwrite init');
  }

  deinit() {
    return Promise.reject('Addon didn\'t overwrite deinit');
  }
}

module.exports = Addon;
