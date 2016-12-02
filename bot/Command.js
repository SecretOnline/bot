const Channel = require('./Channel.js');

var perms = {
  DEFAULT: 0,
  ADMIN: 1,
  OVERLORD: 2,
  SUPERUSER: 3
};

/**
 * A bot command
 */
class Command {

  /**
   * Creates a new command
   * @param {function|string}                funct      Function to call when processing. Strings get converted into a function
   * @param {string}                         group      Command group this command belongs to
   * @param {number=}                        permission Permission level required for this command
   * @param {function|string|Array<string>=} help       Help
   */
  constructor(funct, group = 'nogroup', permission = perms.DEFAULT, help = null) {
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

    if (!group.match(/^[\w._-]+$/)) {
      throw new Error(`command groups must only contain alphanumeric characters, dashes, underscores, and full stops (periods) '${group}'`);
    }

    this.g = group;
  }

  //region Properties

  /**
   * The command group this Command belongs to
   * @readonly
   * @return {string} Group identifier
   */
  get group() {
    return this.g;
  }

  /**
   * Permission level required for this command
   * @readonly
   * @return {number} Permission level
   */
  get permission() {
    return this.p;
  }

  //endregion

  //region Functions

  /**
   * Runs the command with the given Input
   * @param  {Input}                 input Input to the command
   * @return {Promise<string,Error>}       Result from running the command
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
   * @param {Input} input Input. May have empty `.text`
   * @return {string} Help string
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
   * Creates a function that processes the string
   * @param  {string}   str String to process
   * @return {function}     Function to give to the Command constructor
   */
  static makeStringFunction(str) {
    return (input) => {
      return input.process()
        .then((res) => {
          if (str.match(/{args}|{user}/)) {
            let server = input.message.channel instanceof Channel ? input.message.channel.server.name : 'private message';
            let channel = input.message.channel instanceof Channel ? input.message.channel.mention() : 'private message';

            return str
              .replace(/{args}/g, res)
              .replace(/{channel}/g, channel)
              .replace(/{server}/g, server)
              .replace(/{user}/g, input.user.mention());
          } else {
            if (input) {
              return `${str} ${res}`;
            } else {
              return str;
            }
          }
        });
    };
  }

  /**
   * The avaiable permission levels
   * @readonly
   */
  static get PermissionLevels() {
    return perms;
  }

  //endregion
}

module.exports = Command;
