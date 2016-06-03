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
    return new Promise((resolve, reject) => {
      var quickReturn = true;
      var output = '';
      var words = this.m.content.split(' ');

      for (var i = 0; i < words.length; i++) {
        let comm = this.b.getCommand(words[i], this.m);

        if (comm) {
          quickReturn = false;
          words.splice(i + 1);
          var newIn = this.from(words.join(' '));

          newIn.process()
            .then(resolve);
          break;
        } else {
          output += ` ${words[i]}`;
        }
      }

      if (quickReturn) {
        resolve(output);
      }
    });
  }

  from(text) {
    return new Input(this.m.merge({
      content: text
    }), this.b);
  }
}

module.exports = Input;
