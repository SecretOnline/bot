/* jslint node: true, esversion: 6 */
'use strict';

/**
 *
 */
class Command {
  constructor(funct, group, properties) {
    var functType = typeof funct;
    if (functType === 'string') {
      this.f = Command.makeStringFunction(funct);
    } else if (functType === 'function') {
      this.f = funct;
    } else {
      throw new TypeError('commands must be a function or a string');
    }

    this.g = group;
    this.prop = properties;
  }

  get group() {
    return this.g;
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
          return str
            .replace(/\{args\}/g, res)
            .replace(/\{user\}/g, input.user.name);
        });
    };
  }
}

module.exports = Command;
