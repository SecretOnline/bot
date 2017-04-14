const Discord = require('discord.js');
const Emoji = require('node-emoji');
const emojiRegex = require('emoji-regex');
const InputOverride = require('./InputOverride');
const Animation = require('./Animation');
const {quoteSplit} = require('../util');

/**
 * A result from a command
 * 
 * @class Result
 */
class Result {
  constructor(isPrivate) {
    this._embeds = [];
    this._reactions = [];
    this._animations = [];
    this._text = '';
    this._parts = null;
    this._updated = false;
    this._private = !!isPrivate; // Explicit boolean cast
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
   * Array of reactions this message contains
   * 
   * @readonly
   * @returns {Array<ReAction>} ReActions that can be used on this Result
   * 
   * @memberOf Result
   */
  get reactions() {
    return this._reactions.slice();
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
   * Animations to be played in this Result
   * 
   * @readonly
   * @returns {Array<string>} Animations to play
   * 
   * @memberOf Result
   */
  get animations() {
    return this._animations.slice();
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
      this._updated = true;
      this._text = item;
    } else if (item instanceof Discord.RichEmbed) {
      this._embeds.push(item);
    } else if (item instanceof ReAction) {
      this._reactions.push(item);
    } else if (item instanceof Animation) {
      this._animations.push(item);
    } else {
      return false;
    }
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

    this.add(result.text);
    
    if (result.embeds.length) {
      result.embeds.forEach((embed) => {
        this.add(embed);
      });
    }
    if (result.reactions.length) {
      // For every reaction...
      result.reactions.forEach((reaction) => {
        // ... there is an equal and equivalent reaction
        // Not quite Newton's Third Law of Motion
        this.add(reaction);
      });
    }
    if (result.animations.length) {
      result.animations.forEach((animation) => {
        this.add(animation);
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

  /**
   * An action to be taken when reacted to
   * 
   * @readonly
   * @static
   * 
   * @memberOf Result
   */
  static get ReAction() {
    return ReAction;
  }
}

/**
 * An action to be taken when reacted to
 * 
 * @class ReAction
 */
class ReAction {
  /**
   * Creates an instance of ReAction.
   * 
   * @param {(string|function)} action Action to be taken then reacted to
   * 
   * @memberOf ReAction
   */
  constructor(emoji, description, input, action) {
    this._description = description;
    this._input = input;
    this._action = action;
    this._users = [];

    // Check string to make sure it's all emoji
    let match = emoji.match(emojiRegex());
    if (match && match[0] === emoji) {
      this._emoji = emoji;
    } else {
      let e = Emoji.get(emoji);
      if (e.match(/^:.*:$/)) {
        throw `${emoji} isn't in the emoji dictionary`;
      }
      if (e) {
        this._emoji = e;
      } else {
        throw `${emoji} was not found to be an emoji`;
      }
    }
  }

  get emoji() {
    return this._emoji;
  }

  get emojiName() {
    return Emoji.which(this._emoji);
  }

  get description() {
    return this._description;
  }
  
  act(user, channel) {
    if (this._users.includes(user.id)) {
      return;
    }
    this._users.push(user.id);

    let str;
    let prom;
    let over = new InputOverride('', user, channel);

    if (typeof this._action === 'string') {
      str = this._action;
    } else if (typeof this._action === 'function') {
      let fRes = this._action(this._input.from(over, new Result()));
      if (typeof fRes === 'string') {
        str = fRes;
      } else if (fRes instanceof Promise) {
        prom = fRes;
      }
    }

    if (!prom && str !== undefined) {
      over = over.merge(new InputOverride(str));
      prom = this._input
        .from(over, new Result())
        .process();
    }


    return prom
      .catch((err) => {
        if (err) {
          if (typeof err === 'string') {
            let embed = this._input.bot.embedify(err, true)
              .setFooter('this Action will not work again');

            this._input.bot.send(user, embed, true);
          } else if (err instanceof Error) {
            this._input.bot.error(err);
          }
        }
      })
      .then((result) => {
        if (result) {
          let target = result.private ? user : channel;
          this._input.bot.send(target, result);
        }
      });
  }
}

module.exports = Result;
