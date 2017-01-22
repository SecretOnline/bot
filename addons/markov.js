const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');

class MarkovAddon extends ScriptAddon {
  constructor(bot) {
    super(bot, 'markov');

    this.channelData = new Map();
    this.numMessages = 100;
  }

  init() {
    this.bot.addCommand('markov', new Command(this.doMarkov.bind(this), 'markov'));
  }

  doMarkov(input) {
    return new Promise((resolve, reject) => {
      let id = input.message.channel.id;
      if (!this.channelData.has(id)) {
        this.channelData.set(id, []);
      }

      let oldMessages = this.channelData.get(id);
      let fetchOpt = {
        limit: this.numMessages
      };
      if (oldMessages.length) {
        fetchOpt.after = oldMessages[oldMessages.length - 1].id;
      }

      input.message.channel
        .fetchMessages(fetchOpt)
        .then((newMessages) => {
          let messages = oldMessages.slice(0, newMessages.length).concat(newMessages);

          this.channelData.set(id, messages);

          return messages;
        })
        .then((messages) => {
          let mkv = new markov(2);
          let promises = messages
            .filter(msg => msg.content) // Don't do messages with no content
            .map((message) => {
              return new Promise((resolve2, reject2) => {
                mkv.seed(message.cleanContent, resolve2);
              });
            });

          return Promise.all(promises)
            .then(() => {
              console.log('in markov');
              return mkv;
            });
        })
        .then((mkv) => {
          let res = mkv.respond(input.text);
          resolve(res);
        })
        .catch(reject);
    });
  }
}

module.exports = MarkovAddon;

/**
 * A Markov Chain generator
 * 
 * @class MarkovChain
 */
class MarkovChain {
  /**
   * Creates an instance of MarkovChain.
   * 
   * @param {number} [size=200] How many inputs to keep. Old inputs are removed as new ones are added
   * 
   * @memberOf MarkovChain
   */
  constructor(size = 200) {
    this.inputs = new Map();
    this.index = 0;
    this.pairs = new Map();
    this.size = 200;
  }
  
  /**
   * Finds the next word in the chain
   * 
   * @param {any} word Word to find the next of
   * 
   * @memberOf MarkovChain
   */
  next(word) {

  }

  /**
   * Creates a chain of the given length with the given starter
   * 
   * @param {number} [length=20] Length to generate
   * 
   * @memberOf MarkovChain
   */
  chain(start, length = 20) {

  }

  /**
   * Adds text to the chain generator
   * If the generator is at its size, will also remove old entries
   * 
   * @param {string} text Words to add to the chain generator
   * 
   * @memberOf MarkovChain
   */
  add(text) {

  }
}
