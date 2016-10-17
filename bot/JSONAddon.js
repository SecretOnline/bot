const Addon = require('./Addon.js');
const Command = require('./Command.js');

class JSONAddon extends Addon {
  constructor(bot, data = {}, filename = 'NONAME') {
    super(bot, filename);

    this.data = data;
    this.help = [
      `This command has no help because it is part of the ${this.ns} addon`,
      'Commands in this addon are call/response, and therefore provide no help'
    ];
  }


  init() {
    Object.keys(this.data).forEach((key) => {
      JSONAddon.generateCommand(this.bot, this.ns, key, this.data[key]);
    });
  }

  deinit() {
    // Do nothing
  }

  static generateCommand(bot, ns, trigger, response) {
    let fn = Command.makeStringFunction(response);
    let help = JSONAddon.generateHelp(trigger, response);
    let comm = new Command(fn, ns, help);
    bot.addCommand(trigger, comm);

    return comm;
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
