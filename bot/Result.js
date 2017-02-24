let Discord = require('discord.js');
let {quoteSplit} = require('../util');

/**
 * A result from a command
 * 
 * @class Result
 */
class Result {
  constructor() {
    this._embeds = [];
    this._text = '';
    this._parts = null;
    this._updated = false;
  }

  /**
   * Array of embeds this message contains
   * 
   * @readonly
   * @returns {Array<Discord.RichEmbed>} Embeds to be sent with this message
   * 
   * @memberOf Result
   */
  get embeds() {
    return this._embeds.slice();
  }

  /**
   * Text content of this Result
   * 
   * @readonly
   * @returns {string} Text content
   * 
   * @memberOf Result
   */
  get text() {
    return this._text;
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
    if (this._parts && !this._updated) {
      return this._parts;
    } else {
      this._parts = quoteSplit(this._text);
      return this._parts;
    }
  }
  
  add(item) {
    if (typeof item === 'string') {
      this._text += ` ${item}`;
    } else if (item instanceof Discord.RichEmbed) {
      this.embeds.push(item);
    } else {
      return false;
    }
    this._updated = true;
    return true;
  }

  merge(result) {
    if (!(result instanceof Result)) {
      throw 'unable to merge non-Result object';
    }

    if (result.text) {
      this.add(result.text);
    }
    if (result.embeds.length) {
      result.embeds.forEach((embed) => {
        this.add(embed);
      });
    }
  }

  /**
   * Throws an exception to notify of commands that haven't been updated
   * to use Results yet 
   * 
   * @memberOf Result
   */
  toString() {
    throw 'command has not been updated to handle Results';
  }
}

module.exports = Result;
