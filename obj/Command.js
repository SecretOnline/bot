'use strict';

var perms = {
  DEFAULT: 0,
  ADMIN: 1,
  OVERLORD: 2
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

    this.g = group;
  }

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
   * @param {Input} input Input. May have empty `.raw`
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
            return str
              .replace(/{args}/g, res)
              .replace(/{user}/g, input.user.username);
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
}

module.exports = Command;
