/* jslint node: true, esversion: 6 */
'use strict';

/**
 *
 */
class Input {
  constructor(text, author, bot) {
    if (!text) {
      throw new Error('text not given to input constructor');
    }
    if (!author) {
      throw new Error('author not given to input constructor');
    }
    if (!bot) {
      throw new Error('bot not given to input constructor');
    }
    if (typeof text !== 'string') {
      throw new TypeError('text must be a string');
    }

    this.t = text;
    this.a = author;
    this.b = bot;
  }

  get raw() {
    return this.t;
  }

  get user() {
    return this.a;
  }

  process() {
    throw new Error('nyi');
  }

  from(text) {
    return new Input(text, this.a, this.b);
  }


}
