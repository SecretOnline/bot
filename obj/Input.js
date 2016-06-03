/* jslint node: true, esversion: 6 */
'use strict';

/**
 *
 */
class Input {
  constructor(message, bot) {
    if (!message) {
      throw new Error('message not given to input constructor');
    }
    if (!bot) {
      throw new Error('bot not given to input constructor');
    }

    this.m = message;
    this.b = bot;
  }

  get raw() {
    return this.m.content;
  }

  get user() {
    return this.m.author;
  }

  process() {
    throw new Error('nyi');
  }

  from(text) {
    return new Input(text, this.a, this.b);
  }
}

module.exports = Input;
