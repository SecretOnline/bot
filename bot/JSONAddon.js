const Addon = require('./Addon.js');
const Command = require('./Command.js');

class JSONAddon extends Addon {
  constructor(bot, data = {}, filename = 'NONAME') {
    super(bot, {}, filename);

    this.data = data;
    this.help = [
      `This command has no help because it is part of the ${this.ns} addon`,
      'Commands in this addon are call/response, and therefore provide no help'
    ];
  }


  init() {
    Object.keys(this.data).forEach((key) => {
      let fn = Command.makeStringFunction(this.data[key]);
      let help = JSONAddon.generateHelp(key, this.data[key]);
      this._addCommand(key, new Command(fn, this.ns, help));
    });
  }

  deinit() {
    this.commands.forEach((trigger, command) => {
      this.bot.removeCommand(trigger, command);
    });

    this.commands.clear();
  }

  static generateHelp(trigger, response) {
    return [
      'a call response command',
      `usage: \`~${trigger}\``,
      `response: \`${response}\``
    ];
  }
}

module.exports = JSONAddon;
