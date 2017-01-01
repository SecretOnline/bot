const fs = require('fs');
const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');

// var time = 2 * 1000;
var time = 30 * 60 * 1000;
// var variation = 1 * 1000;
var variation = 10 * 60 * 1000;

class GameChange extends ScriptAddon {
  constructor(bot) {
    super(bot, 'game-change');

    this.games = [];
    this.conf.path = this.conf.path || 'games.conf.json';
    this.timeout;

    fs.readFile(`./${this.conf.path}`, 'utf8', (err, data) => {
      try {
        this.games = JSON.parse(data);
      } catch (e) {
        this.games = [];
        fs.writeFile(this.conf.path, JSON.stringify(this.games, null, 2), () => {});
        return;
      }

      this.pickRandomGame();
    });
  }

  init() {
    this.bot.addCommand('change-game', new Command(this.changeGame.bind(this), 'discord.misc', Command.PermissionLevels.OVERLORD));
  }

  deinit() {
    // Do nothing
  }

  updateGamesList(data) {
    try {
      this.games = JSON.parse(data);
      this.log('loaded games');
    } catch (e) {
      this.games = this.games || [];
    }
  }

  changeGame(input) {
    if (input.text) {
      return input.process()
        .then((result) => {
          this.set(result);

          clearTimeout(this.timeout);

          return `set game to ${result}`;
        });
    } else {
      if (this.timeout) {
        clearTimeout(this.timeout);
      }
      this.pickRandomGame();
      return 'going back to random games';
    }
  }

  pickRandomGame() {
    if (this.games.length === 0) {
      throw new Error('no games to choose');
    }

    var game = this.games[Math.floor(Math.random() * this.games.length)];

    var vary = Math.floor((Math.random() * variation * 2) - variation);
    this.timeout = setTimeout(this.pickRandomGame.bind(this), time + vary);

    this.set(game);
  }

  set(game) {
    this.log(`set game to ${game}`);
    this.bot.discord.user.setGame(game);
  }
}

module.exports = GameChange;
