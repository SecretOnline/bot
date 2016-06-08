'use strict';

/**
 * An input to be processed
 */
class Input {
  /**
   * Creates a new Input
   * @param  {string}   text    Overriding string for input
   * @param  {IMessage} message Original message that started this chain
   * @param  {Bot}      bot     Bot this input is processing from
   */
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

  /**
   * Raw text given to this input
   * @readonly
   * @return {string} Given text
   */
  get raw() {
    return this.t;
  }

  /**
   * Message that started this input chain
   * @readonly
   * @return {IMessage} Original message
   */
  get originalMessage() {
    return this.m;
  }

  /**
   * User that sent the message
   * @readonly
   * @return {IUser} Original user
   */
  get user() {
    return this.m.author;
  }

  /**
   * Processes this input
   * @return {Promise<string,Error>} Resolves with final output
   */
  process() {
    return new Promise((resolve, reject) => {
      function appendResult(res) {
        if (output) {
          output += ` ${res}`;
        } else {
          output = res;
        }
        resolve(output);
      }

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
            .then(appendResult, reject);
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

  /**
   * Creates a new Input based on this one
   * @param  {string} text New text
   * @return {Input}       The new Input
   */
  from(text) {
    return new Input(text, this.m, this.b);
  }
}

module.exports = Input;
