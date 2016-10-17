const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');

class Test extends ScriptAddon {
  constructor(bot) {
    super(bot, 'test');
  }

  init() {
    this.bot.addCommand('permtest', new Command(this.doTest, 'test', Command.PermissionLevels.ADMIN));
    this.bot.addCommand('reject', new Command(this.rejecter, 'test', Command.PermissionLevels.OVERLORD));
    this.bot.addCommand('conflict', new Command(this.conflict1, 'conflict1', Command.PermissionLevels.OVERLORD));
    this.bot.addCommand('conflict', new Command(this.conflict2, 'conflict2', Command.PermissionLevels.OVERLORD));
  }

  deinit() {
    // Do nothing
  }

  doTest() {
    return 'permission test passed';
  }

  rejecter(input) {
    return input.process()
      .then((result) => {
        return new Promise((resolve, reject) => {
          reject(result);
        });
      });
  }

  conflict1() {
    return 'resolved to conflict 1';
  }

  conflict2() {
    return 'resolved to conflict 2';
  }
}

module.exports = Test;
