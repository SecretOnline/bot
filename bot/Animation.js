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
    this.frames = frames;
    this.interval = Math.max(interval, 500);
    this.color = color;
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
    let messageObjects = this.frames.map((frame) => {
      return {
        embed: embedify(frame, this.color)
      };
    });

    // Initial message promise
    let messageProm = Promise.all([
      channel.send(messageObjects[0]),
      delay(this.interval)
    ]);

    let completeProm = messageProm
      .then(([message]) => {
        // Fucntions that return the Promises to edit the message 
        let editFunctions = messageObjects
          .slice(1)
          .map((frame) => {
            return () => Promise.all([
              message.edit(frame),
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
