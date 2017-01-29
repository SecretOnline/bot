const Discord = require('discord.js');

var perms = {
  DISALLOWED: -1,
  DEFAULT: 0,
  ADMIN: 1,
  OVERLORD: 2,
  SUPERUSER: 3
};

/**
 * A bot command
 * 
 * @class Command
 */
class Command {

  /**
   * Creates an instance of Command.
   * 
   * @param {Addon} [addon] Addon this command belongs to
   * @param {(function|string)} funct Function to call when processing. Strings get converted into a function
   * @param {number} [permission=perms.DEFAULT] Permission level required for this command
   * @param {(function|string|Array<string>)} [help=null] Help for this command
   * 
   * @memberOf Command
   */
  constructor(addon, funct, permission = perms.DEFAULT, help = null) {
    // Type checking
    if (typeof addon === 'function') {
      throw new Error('Command was not given an addon. Are you using the old Command definition?');
    }
    var functType = typeof funct;
    if (functType === 'string') {
      this.f = Command.makeStringFunction(funct);
    } else if (functType === 'function') {
      this.f = funct;
    } else {
      throw new TypeError('commands must be a function or a string');
    }

    if (typeof permission === 'number') {
      this.p = permission;
      this.h = help;
    } else {
      this.p = perms.DEFAULT;
      this.h = permission;
    }

    if (!addon) {
      throw new Error('Addon was not given when creating command');
    }
    this.a = addon;
  }

  //region Properties

  /**
   * Addon that created this command
   * 
   * @readonly
   * @returns {Addon} Creator
   * 
   * @memberOf Command
   */
  get addon() {
    return this.a;
  }

  /**
   * Permission level required for this command
   * 
   * @readonly
   * @returns {number} Permission level
   * 
   * @memberOf Command
   */
  get permission() {
    return this.p;
  }

  //endregion

  //region Functions

  /**
   * Runs the command with the given Input
   * 
   * @param {Input} input
   * @returns {Promise<string>} Result from running the command
   * 
   * @memberOf Command
   */
  run(input) {
    return new Promise((resolve, reject) => {
      var result = this.f(input);
      if (result instanceof Promise) {
        result.then(resolve, reject);
      } else {
        resolve(result);
      }
    });
  }

  /**
   * Help for this command
   * 
   * @param {Input} [input] Input for the help. Only used if help is a function
   * @returns {string} Help string
   * 
   * @memberOf Command
   */
  help(input) {
    if (this.h) {
      if (Array.isArray(this.h)) {
        return this.h.join('\n');
      } else {
        let type = typeof this.h;
        if (type === 'string') {
          return this.h;
        } else if (type === 'function') {
          return this.h(input);
        }
      }
    }
  }

  //endregion

  //region Static Functions

  /**
   * Creates a function for use in a Command that processes a string
   * 
   * @static
   * @param {string} str String to process
   * @returns {function} Function to give to the Command constructor
   * 
   * @memberOf Command
   */
  static makeStringFunction(str) {
    return (input) => {
      return input.process()
        .then((res) => {
          if (str.match(/{\w+}/)) {
            let server = input.message.channel instanceof Discord.TextChannel ? input.message.guild.toString() : 'private message';
            let channel = input.message.channel instanceof Discord.TextChannel ? input.message.channel.toString() : 'private message';

            let replacement = str
              .replace(/{args}/g, res)
              .replace(/{channel}/g, channel)
              .replace(/{server}/g, server)
              .replace(/{user}/g, input.user.toString());

            if (!str.match(/{args}/)) {
              return `${replacement} ${res}`;
            }

            return replacement;
          } else {
            if (res) {
              return `${str} ${res}`;
            } else {
              return str;
            }
          }
        });
    };
  }

  /**
   * Permission levels used by the bot
   * 
   * @readonly
   * @static
   * @returns {Object} Object of key/values for permissions
   * 
   * @memberOf Command
   */
  static get PermissionLevels() {
    return perms;
  }

  //endregion
}

module.exports = Command;
