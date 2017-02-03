const ytdl = require('ytdl-core');
const ScriptAddon = require('../bot/ScriptAddon.js');

class Music extends ScriptAddon {
  constructor(bot) {
    super(bot, 'music');
  }

  init() {

  }
}

module.exports = Music;
