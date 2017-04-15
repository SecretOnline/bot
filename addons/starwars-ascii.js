const ScriptAddon = require('../bot/ScriptAddon.js');

class StarWars extends ScriptAddon {
  constructor(bot) {
    super(bot, 'sw-ascii');
  }

  get description() {
    return 'play the star wards ASCII animation from http://www.asciimation.co.nz/';
  }

  init() {

  }
}

module.exports = StarWars;
