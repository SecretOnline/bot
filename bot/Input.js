/**
 * An object to be used by commands
 */
class Input {
  /**
   * Creates a new input
   * @param  {Message} message Message that this input stems from
   * @param  {string=} text    Override text (uses message.text by default)
   */
  constructor(message, bot, text = message.text) {
    this.m = message;
    this.t = text;
    this.b = bot;
  }

  //region Properties

  get text() {
    return this.t;
  }

  get message() {
    return this.m;
  }

  get user() {
    return this.m.user;
  }

  //endregion

  //region Functions

  /**
   * Processes this input
   * @return {Promise<string,Error>} Resolves with final output
   */
  process() {
    return new Promise((resolve, reject) => {
      /**
       * Adds result to end of string and Resolves
       * @param  {string} res String to append
       */
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

      // Iterate over all words
      for (var i = 0; i < words.length; i++) {
        let comm;
        try {
          comm = this.b.getCommand(words[i], this.m);
        } catch (e) {
          reject(e)
        }

        if (comm) {
          var newStr = '';
          // Stop the immediate resolving
          quickReturn = false;
          if (words.length !== 1) {
            newStr = words.splice(i + 1).join(' ');
          }
          // Make new command object and run it
          var newIn = this.from(newStr);
          comm.run(newIn)
            .then(appendResult, reject);

          // Since command encountered, stop here
          break;
        } else {
          // If no command found, add word to string
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
    return new Input(this.m, this.b, text);
  }

  //endregion

}

module.exports = Input;
