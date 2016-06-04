'use strict';

/**
 *
 */
class Input {
  constructor(text, message, bot) {
    if (!message) {
      throw new Error('message not given to input constructor');
    }
    if (!bot) {
      throw new Error('bot not given to input constructor');
    }

    this.t = text;
    this.m = message;
    this.b = bot;
  }

  get raw() {
    return this.t;
  }

  get originalMessage() {
    return this.m;
  }

  get user() {
    return this.m.author;
  }

  process() {
    return new Promise((resolve, reject) => {
      var quickReturn = true;
      var output = '';
      var words = this.t.split(' ');

      for (var i = 0; i < words.length; i++) {
        let comm = this.b.getCommand(words[i], this.m);

        if (comm) {
          var newStr = '';
          quickReturn = false;
          if (words.length !== 1) {
            newStr = words.splice(i + 1).join(' ');
          }
          var newIn = this.from(newStr);
          comm.run(newIn)
            .then((res) => {
              if (output) {
                output += ` ${res}`;
              } else {
                output = res;
              }
              resolve(output);
            });
          break;
        } else {
          if (output) {
            output += ` ${words[i]}`;
          } else {
            output = words[i];
          }
        }
      }

      if (quickReturn) {
        resolve(output);
      }
    });
  }

  from(text) {
    return new Input(text, this.m, this.b);
  }
}

module.exports = Input;
