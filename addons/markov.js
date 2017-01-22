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
    this.isWrapped = false;
    this.pairs = new Map();
    this.maxSize = 1000;
    this.size = Math.min(size, this.maxSize);
    this.endString = '#### END ####'; // Contains spaces, so is safe for special meaning
  }
  
  /**
   * Finds the next word in the chain
   * 
   * @param {any} word Word to find the next of
   * 
   * @memberOf MarkovChain
   */
  next(word) {
    if (word === this.endString) {
      throw new Error('Tried to find words after end string');
    }
    if (!this.pairs.has(word)) {
      throw new Error(`${word} is not in the dictionary`);
    }

    let nexts = Array.from(this.pairs.get(word));
    let totalSize = nexts.reduce((total, curr) => {
      return total += curr[1].length;
    }, 0);
    let index =  Math.floor(Math.random() * totalSize);

    let fIndex = 0;
    while (index > 0) {
      index -= nexts[fIndex][1].length;
      fIndex++;
    }

    return nexts[fIndex][0];
  }

  /**
   * Creates a chain of the given length with the given starter
   * 
   * @param {number} [length=20] Length to generate
   * 
   * @memberOf MarkovChain
   */
  chain(start, length = 20) {
    let outStr = start;

    let prev = start;
    for (var i = 0; i < length; i++) {
      let next = this.next(prev);
      prev = next;
      if (next === this.endString) {
        break;
      }
      outStr += ` ${next}`;
    }

    return outStr;
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
    let words = text.split(' ');
    let pairs = words.map((word, index) => {
      let next;
      if (index === words.length - 1) {
        next = this.endString;
      } else {
        next = words[index + 1];
      }
      return [word, next];
    });

    pairs.forEach((pair) => {
      if (!this.pairs.has(pair[0])) {
        this.pairs.set(pair[0], new Map());
      }

      let vals = this.pairs.get(pair[0]);
      if (vals.has(pair[1])) {
        vals.get(pair[1]).push(this.index); // Add this index to the list
      } else {
        vals.set(pair[1], [this.index]);
      }
    });

    // Do removal only if needed
    if ((this.pairs.size >= this.size) || this.isWrapped) {
      let oldIndex = this.index - this.size;
      if (oldIndex < 0) {
        oldIndex += this.maxSize;
      }

      // For every start word
      for (let [word, nexts] of this.pairs) {
        for (let [next, indicies] of nexts) {
          // Remove all instances of the old index
          while (indicies.indexOf(oldIndex) > -1) {
            indicies.splice(indicies.indexOf(oldIndex), 1);
          }

          // Remove unneeded exits
          if (indicies.length === 0) {
            nexts.delete(next);
          }
        }
        
        // Remove unneeded entries
        if (nexts.size === 0) {
          this.pairs.delete(word);
        }
      }
    }

    

    this.index++; // Increment index
    if (this.index >= Number.MAX_SAFE_INTEGER) { // And make sure it won't go wrong
      this.index = 0;
      this.isWrapped = true;
    }
  }

  dump() {
    let list = {};

    for (let [word, nexts] of this.pairs) {
      let obj = {};
      for (let [next, indicies] of nexts) {
        obj[next] = indicies.length;
      }
      list[word] = obj;
    }

    return list;
  }
}
