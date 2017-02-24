let Discord = require('discord.js');
let Result = require('./Result');
let {quoteSplit} = require('../util');

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
   * @param {Result} [result=null] Result object to use
   * 
   * @memberOf Input
   */
  constructor(message, bot, text = message.content, result = null) {
    this.m = message;
    this.t = text;
    this.b = bot;
    this.a = null;
    if (result) {
      this.r = result;
    } else {
      this.r = new Result();
    }
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

  /**
   * Splits the text by whitespace, except inside quotes
   * 
   * @readonly
   * @returns {Array<string>} Parts of the string given
   * 
   * @memberOf Input
   */
  get args() {
    if (this.a) {
      return this.a;
    } else {
      this.a = quoteSplit(this.t);
      return this.a;
    }
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
            .then((result) => {
              if (result instanceof Result) {
                this.r.merge(result);
              } else if (typeof result === 'string') {
                if (output) {
                  this.r.add(`${output} ${result}`);
                } else {
                  this.r.add(result);
                }
              } else if (result instanceof Discord.RichEmbed) {
                this.r.add(result);
              }

              resolve(this.r);
            }, reject);

          // Since command encountered, stop here
          return;
        } else {
          // If no command found, add word to string
          if (output) {
            output += ` ${words[i]}`;
          } else {
            output = words[i];
          }
        }
      }

      if (output) {
        this.r.add(output);
      }

      if (quickReturn) {
        resolve(this.r);
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
    return new Input(this.m, this.b, text, this.r);
  }

  //endregion

}

module.exports = Input;
