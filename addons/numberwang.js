const ScriptAddon = require('../bot/ScriptAddon.js');
const {arrayRandom} = require('../util');

const nwHelp = [
  'syntax: `~<nw/numberwang> <a number>`',
  'use `~numberwang start` to begin a round',
  'plays a game of Numberwang (https://www.youtube.com/watch?v=qjOZtWZ56lc)',
  'what is Numberwang?',
  'Numberwang is the maths quiz that simply everyone is talking about'
];

class NumberWang extends ScriptAddon {
  constructor(bot) {
    super(bot, 'numberwang');
  }

  init() {
  }
}

module.exports = NumberWang;
