/* jslint node: true, esversion: 6 */
'use strict';

/**
 *
 */
class Command {
  constructor(funct, help) {
    var functType = typeof funct;
    if (functType !== 'string' && functType !== 'function') {
      throw new TypeError('trigger must be either a string or a function');
    }
    this.f = funct;
    this.h = help;
  }

  run(input) {
    throw new Error('nyi');
  }
}
