const Discord = require('discord.js');

const {delay, embedify, promiseChain} = require('../util');

/**
 * A set of frames to be played through editing a message
 *
 * @class Animation
 */
class Animation {
  /**
   * Creates an instance of Animation.
   * @param {Array<string>} frames Array of frames to be played
   * @param {number} [interval=1000] Interval between frames. Minimun of 500ms
   * @param {string} [color='#C90101'] Colour of embed
   *
   * @memberOf Animation
   */
  constructor(frames, interval = 1000, color = '#C90101') {
    this.framePromises = frames
      .map(f => this.createMessage(f));
    this.interval = Math.max(interval, 500);
    this.color = color;
  }

  /**
   * Creates a message object from a frame
   *
   * @param {(string|Discord.RichEmbed|Promise)} frame
   *
   * @memberOf Animation
   */
  createMessage(frame) {
    return Promise.resolve(frame)
      .then((res) => {
        if (res instanceof Discord.RichEmbed) {
          return res;
        } else if (typeof res === 'string') {
          return embedify(res, this.color);
        } else {
          throw 'animation frame was not a valid type';
        }
      })
      .then((embed) => {
        return {
          embed
        };
      });
  }

  /**
   * Plays the animation in a channel
   *
   * @param {Discord.Channel} channel
   * @returns Promise Resolves when animation finishes
   *
   * @memberOf Animation
   */
  play(channel) {
    // Initial message promise
    let messageProm = Promise.all([
      this.framePromises[0]
        .then(f => channel.send(f)),
      delay(this.interval)
    ]);

    let completeProm = messageProm
      .then(([message]) => {
        // Fucntions that return the Promises to edit the message
        let editFunctions = this.framePromises
          .slice(1)
          .map((frameProm) => {
            return () => Promise.all([
              frameProm
                .then(f =>  message.edit(f)),
              delay(this.interval)
            ]);
          });

        return promiseChain(editFunctions);
      });

    // Resolves with promise that resolves when animation finished
    return Promise.resolve(completeProm);
  }
}

module.exports = Animation;
