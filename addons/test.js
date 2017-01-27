const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');

const request = require('../util').request;

class Test extends ScriptAddon {
  constructor(bot) {
    super(bot, 'test');
  }

  init() {
    this.bot.addCommand('permtest', new Command(this.doTest, 'test', Command.PermissionLevels.ADMIN));
    this.bot.addCommand('reject', new Command(this.rejecter, 'test', Command.PermissionLevels.OVERLORD));
    this.bot.addCommand('conflict', new Command(this.conflict1, 'conflict1', Command.PermissionLevels.OVERLORD));
    this.bot.addCommand('conflict', new Command(this.conflict2, 'conflict2', Command.PermissionLevels.OVERLORD));
    this.bot.addCommand('http-status-code', new Command(this.httpStatus, 'test', Command.PermissionLevels.OVERLORD));
    this.bot.addCommand('dump-log', new Command(this.dumpLog, 'test', Command.PermissionLevels.OVERLORD));
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

  httpStatus(input) {
    let code = input.text.match(/^(\d{3})$/);
    if (!code) {
      return 'must supply an HTTP status code';
    }
    return request(`https://httpbin.org/status/${code[1]}`)
      .then((res) => {
        return `got response: ${res}`;
      });
  }

  dumpLog(input) {
    return this.bot.getLogs(()=>true, 120)
      .then((lines) => {
        return lines.length.toString();
      });
  }
}

module.exports = Test;
