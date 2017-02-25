const Emoji = require('node-emoji');
const emojiRegex = require('emoji-regex');
const InputOverride = require('./InputOverride');

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

    // Check string to make sure it's all emoji
    if (emoji.match(emojiRegex())[0] === emoji) {
      this._emoji = emoji;
    } else {
      let e = Emoji.get(emoji);
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

  get description() {
    return this._description;
  }
  
  act(user, channel) {
    let str;
    let prom;
    let over = new InputOverride('', user, channel);

    if (typeof this._action === 'string') {
      str = this._action;
    } else if (typeof this._action === 'function') {
      let fRes = this._action(this._input.from(over));
      if (typeof fRes === 'string') {
        str = fRes;
      } else if (fRes instanceof Promise) {
        prom = fRes;
      }
    }

    if (!prom && str !== undefined) {
      over = over.merge(new InputOverride(str));
      prom = this._input
        .from(over)
        .process();
    }


    return prom
      .catch((err) => {
        if (err) {
          if (typeof err === 'string') {
            let embed = this.embedify(err)
              .setFooter('edits will no longer work for this message');

            this.send(over.user, embed, true);
          } else if (err instanceof Error) {
            this.error(err);
          }
        }
      })
      .then((result) => {
        if (result) {
          this._input.bot.send(result);
        }
      });
  }
}

module.exports = ReAction;
