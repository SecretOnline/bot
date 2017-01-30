const Command = require('../bot/Command.js');

/**
 * An addon. Generally manages commands
 * Should be extended by addons
 * 
 * @class Addon
 */
class Addon {
  /**
   * Creates an instance of Addon.
   * 
   * @param {Bot} bot Bot this Addon belongs to
   * @param {string} [namespace='NONAME'] Namespace for this Addon. Configs are shared for addons with the same namespace
   * 
   * @memberOf Addon
   */
  constructor(bot, namespace = 'NONAME') {
    this.bot = bot;
    this.ns = namespace;
  }

  /**
   * The namespace for this addon
   * Addons with the same namespace share the same configuration
   * 
   * @readonly
   * @returns {string} Namespace for the Addon
   * 
   * @memberOf Addon
   */
  get namespace() {
    return this.ns;
  }

  /**
   * Starts up the Addon
   * 
   * @returns {(Promise<any>|any)} Resolves (or returns) when Addon is loaded
   * 
   * @memberOf Addon
   */
  init() {
    return Promise.reject('Addon didn\'t overwrite init. Does it add any commands?');
  }

  /**
   * Shuts down the Addon
   * UNUSED, DOESN'T DO ANYTHING
   * 
   * @returns {(Promise<any>|any)} Resolves (or returns) when the Addon is no longer loaded 
   * 
   * @memberOf Addon
   */
  deinit() {
    return;
  }

  /**
   * Adds a command to the bot
   * 
   * @param {string} trigger Word that is used to trigger the command
   * @param {function} funct Function to call. Autobound
   * @param {number} [permission=Command.PermissionLevels.DEFAULT] Permission level required for this command
   * @param {(function|string|Array<string>)} [help=null]
   * 
   * @memberOf Addon
   */
  addCommand(trigger, funct, permission = Command.PermissionLevels.DEFAULT, help = null) {
    if (!(typeof permission === 'number')) {
      help = permission;
      permission = Command.PermissionLevels.DEFAULT;
    }
    if (typeof funct === 'string') {
      funct = Command.makeStringFunction(funct);
    }

    let command  = new Command(this, funct.bind(this), permission, help);

    this.bot.addCommand(trigger, command);

    return command;
  }

  /**
   * Removes a command from the bot
   * 
   * @param {string} trigger Word that is used to trigger the command
   * @returns
   * 
   * @memberOf Addon
   */
  removeCommand(trigger) {
    return this.bot.removeCommand(trigger, this);
  }

  /**
   * A handler for when a message is sent
   * 
   * @param {Discord.Message} message
   * 
   * @memberOf Addon
   */
  onMessage(message) {
    // No op by default
  }

  /**
   * Logs a message from this Addon
   * 
   * @param {string} message Message to log
   * @returns {string} Content that was written to the console
   * 
   * @memberOf Addon
   */
  log(message) {
    return this.bot.log(message, this);
  }

  /**
   * Logs an error from this Addon
   * 
   * @param {string} message Error message to log
   * @returns {string} Content that was written to the console
   * 
   * @memberOf Addon
   */
  error(message) {
    return this.bot.error(message, this);
  }
}

module.exports = Addon;
