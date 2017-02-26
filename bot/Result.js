const Discord = require('discord.js');
const ReAction = require('./ReAction');
const {quoteSplit} = require('../util');

/**
 * A result from a command
 * 
 * @class Result
 */
class Result {
  constructor() {
    this._embeds = [];
    this._reactions = [];
    this._text = '';
    this._parts = null;
    this._updated = false;
    this._private = false;
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

  /**
   * Whether this Result should be sent as a private message
   * 
   * @readonly
   * @returns {boolean}
   * 
   * @memberOf Result
   */
  get private() {
    return this._private;
  }
  
  /**
   * Adds an item to the Result
   * Strings will overwrite the existing text, embeds get appended
   * 
   * @param {(string|Discord.RichEmbed)} item
   * @returns {boolean}
   * 
   * @memberOf Result
   */
  add(item) {
    if (typeof item === 'string') {
      this._text = item;
    } else if (item instanceof Discord.RichEmbed) {
      this._embeds.push(item);
    } else if (item instanceof ReAction) {
      this._reactions.push(item);
    } else {
      return false;
    }
    this._updated = true;
    return true;
  }

  /**
   * Adds items from given Result to this one
   * 
   * @param {any} result
   * 
   * @memberOf Result
   */
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
    if (result.private) {
      this.setPrivate();
    }
  }

  /**
   * Sets this Result as being private
   * Note: this is irreversible 
   * 
   * @memberOf Result
   */
  setPrivate() {
    this._private = true;
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
