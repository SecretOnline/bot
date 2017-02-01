const Addon = require('./Addon.js');
const Command = require('./Command.js');

/**
 * An Addon that 
 * 
 * @class JSONAddon
 * @extends {Addon}
 */
class JSONAddon extends Addon {
  /**
   * Creates an instance of JSONAddon.
   * 
   * @param {Bot} bot The Bot this Addon belongs to
   * @param {Object} [data={}] A set of key/value pairs for the commands
   * @param {string} [filename='NONAME.json'] Used to get the namespace for this Addon
   * 
   * @memberOf JSONAddon
   */
  constructor(bot, data = {}, filename = 'NONAME.json') {
    let match = filename.match(/(.*)\.json$/);
    if (match) {
      filename = match[1];
    }
    super(bot, filename);

    this.data = data;
  }


  /**
   * Adds the commands to the bot
   * 
   * 
   * @memberOf JSONAddon
   */
  init() {
    this.desc = `${this.ns} is a basic addon with call/response commands. Use \`~help <command-name>\` to see what they do`;
    Object.keys(this.data).forEach((key) => {
      this.generateCommand(key, this.data[key]);
    });
  }

  /**
   * Creates a Command from the given parameters
   * 
   * @param {string} trigger Trigger for the command
   * @param {string} response Response for the command
   * @returns {Command} A new Command
   * 
   * @memberOf JSONAddon
   */
  generateCommand(trigger, response) {
    let fn = Command.makeStringFunction(response);
    let help = JSONAddon.generateHelp(trigger, response);
    let comm = this.addCommand(trigger, fn, help);

    return comm;
  }

  /**
   * Creates help for a string command
   * 
   * @static
   * @param {string} trigger Trigger for the command
   * @param {string} response Response for the command
   * @returns {Array<string>} Help for the command
   * 
   * @memberOf JSONAddon
   */
  static generateHelp(trigger, response) {
    return [
      'a call response command',
      `usage: \`~${trigger}\``,
      `response: \`${response}\``
    ];
  }
}

module.exports = JSONAddon;
