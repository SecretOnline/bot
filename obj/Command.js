/* jslint node: true, esversion: 6 */
'use strict';

var perms = {
  DEFAULT: 0,
  ADMIN: 1,
  OVERLORD: 2
};

/**
 *
 */
class Command {
  constructor(funct, group = 'nogroup', permission = perms.DEFAULT, properties = {}) {
    var functType = typeof funct;
    if (functType === 'string') {
      this.f = Command.makeStringFunction(funct);
    } else if (functType === 'function') {
      this.f = funct;
    } else {
      throw new TypeError('commands must be a function or a string');
    }

    this.g = group;
    this.p = permission;
    this.prop = properties;
  }

  get group() {
    return this.g;
  }

  get permission() {
    return this.p;
  }

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

  static get PermissionLevels() {
    return perms;
  }
}

module.exports = Command;
