/**
 * An object to be used by commands
 * 
 * @class Input
 */
class Input {
  /**
   * Creates an instance of Input.
   * 
   * @param {Discord.Message} message Message that this input stems from
   * @param {Bot} bot
   * @param {string} [text=message.content] Override text
   * 
   * @memberOf Input
   */
  constructor(message, bot, text = message.content) {
    this.m = message;
    this.t = text;
    this.b = bot;
  }

  //region Properties

  /**
   * The current text value for this Input
   * 
   * @readonly
   * @returns {string} Text of this Input
   * 
   * @memberOf Input
   */
  get text() {
    return this.t;
  }

  /**
   * Message this Input is based off
   * 
   * @readonly
   * @returns {Discord.Message} Message this Input comes from
   * 
   * @memberOf Input
   */
  get message() {
    return this.m;
  }

  /**
   * User who sent the original Message
   * 
   * @readonly
   * @returns {Discord.User} User the original Message was sent by
   * 
   * @memberOf Input
   */
  get user() {
    return this.m.author;
  }

  //endregion

  //region Functions

  /**
   * Processes this input
   * 
   * @returns {Promise<string>} Resolves with final output
   * 
   * @memberOf Input
   */
  process() {
    return new Promise((resolve, reject) => {
      /**
       * Adds result to end of string and Resolves
       * 
       * @param {string} res String to append
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
          reject(e);
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

  /**
   * Creates a new Input based on this one, but with new text
   * 
   * @param {string} text Text for new Input
   * @returns {Input} New Input object
   * 
   * @memberOf Input
   */
  from(text) {
    return new Input(this.m, this.b, text);
  }

  //endregion

}

module.exports = Input;
