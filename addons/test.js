const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');
const {ReAction} = require('../bot/Result.js');

const request = require('../util').request;

class Test extends ScriptAddon {
  constructor(bot) {
    super(bot, 'test');

    this.desc = 'A few test commands, mostly for the creation of bot';
  }

  init() {
    this.addCommand('permtest', this.doTest, Command.PermissionLevels.ADMIN);
    this.addCommand('reject', this.rejecter, Command.PermissionLevels.OVERLORD);
    this.addCommand('http-status-code', this.httpStatus, Command.PermissionLevels.OVERLORD);
    this.addCommand('dump-log', this.dumpLog, Command.PermissionLevels.OVERLORD);
    this.addCommand('args', this.args, Command.PermissionLevels.OVERLORD);
    this.addCommand('embedify', this.embedify, Command.PermissionLevels.OVERLORD);
    this.addCommand('add-action', this.addAction, Command.PermissionLevels.OVERLORD);
    this.addCommand('set-conf', this.userConf, Command.PermissionLevels.OVERLORD);
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
          reject(result.text);
        });
      });
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

  args(input) {
    return JSON.stringify(input.args);
  }

  embedify(input) {
    return input.process()
      .then((res) => {
        return this.bot.embedify(res.text);
      });
  }

  addAction(input) {
    return input.process()
      .then((res) => {
        res.add(new ReAction('ok_hand', 'Will do `~lenny`', input, '~lenny'));
        res.add(new ReAction('thumbsdown', 'Will do `~reject you fail`', input, '~reject you fail'));
        return 'there should be an action incoming';
      });
  }

  userConf(input) {
    return input.process()
      .then((res) => {
        let conf = this.getUser(input.user);
        conf[res.args[0]] = res.args.slice(1).join(' ');
        this.setUser(conf, input.user);
      });
  }
}

module.exports = Test;
