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
   * @param {Result} [result=null] Result object to use
   * @param {InputOverride} [override=null] Override object
   * 
   * @memberOf Input
   */
  constructor(message, bot, result = null, override = null) {
    this.m = message;
    this.b = bot;
    this.a = null;
    this.r = result || new Result();
    this.o = override || new InputOverride(message.content, message.author, message.channel);
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
    return this.o.text;
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
    return this.o.user;
  }

  /**
   * Channel the message was sent from
   * 
   * @readonly
   * @returns {Discord.TextBasedChannel} User the original Message was sent by
   * 
   * @memberOf Input
   */
  get channel() {
    return this.o.channel;
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
      this.a = quoteSplit(this.text);
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
      var words = this.text.split(' ');

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
          let over = new InputOverride(newStr);
          var newIn = this.from(over);
          comm.run(newIn)
            .then((result) => {
              if (result instanceof Result) {
                if (result !== this.r) {
                  this.r.merge(result);
                }
              } else if (typeof result === 'string') {
                if (output) {
                  this.r.add(`${output} ${result}`);
                } else {
                  this.r.add(result);
                }
              } else if (result instanceof Discord.RichEmbed) {
                if (output) {
                  this.r.add(`${this.r.text} ${output}`);
                }
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
   * @param {InputOverride} override Overriding information for the new Input
   * @returns {Input} New Input object
   * 
   * @memberOf Input
   */
  from(override) {
    // TODO: Remove deprecated option
    if ((!(override instanceof InputOverride))) {
      console.warn('use of Input.from(<string>) is deprecated. use Input.from(<Input.Override>) instead');
      let over = new InputOverride(override);
      return new Input(this.m, this.b, this.r, this.o.merge(over));
    }
    return new Input(this.m, this.b, this.r, this.o.merge(override));
  }

  //endregion

  //region Static
  
  static get Override() {
    return InputOverride;
  }
  
  //endregion
}

/**
 * An override for an Input's data
 * 
 * @class InputOverride
 */
class InputOverride {
  /**
   * Creates an instance of InputOverride.
   * 
   * @param {string} [text=null]
   * @param {(Discord.User|Discord.GuildMember)} [user=null]
   * @param {(Discord.DMChannel|Discord.TextChannel)} [channel=null]
   * 
   * @memberOf InputOverride
   */
  constructor(text = null, user = null, channel = null) {
    this._text = text;
    this._user = user;
    this._channel = channel;
  }

  /**
   * Text of this override
   * 
   * @readonly
   * 
   * @memberOf InputOverride
   */
  get text() {
    return this._text;
  }

  /**
   * User of this override
   * 
   * @readonly
   * 
   * @memberOf InputOverride
   */
  get user() {
    return this._user;
  }

  /**
   * Channel of this override
   * 
   * @readonly
   * 
   * @memberOf InputOverride
   */
  get channel() {
    return this._channel;
  }

  merge(override) {
    if (override.text !== null) {
      this._text = override.text;
    }
    if (override.user !== null) {
      this._user = override.user;
    }
    if (override.channel !== null) {
      this._channel = override.channel;
    }
  }  
}

module.exports = Input;
