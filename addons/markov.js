const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');
const Input = require('../bot/Input.js');

class MarkovAddon extends ScriptAddon {
  constructor(bot) {
    super(bot, 'markov');

    this.channelData = new Map();
    this.numMessages = 100;
  }

  init() {
    this.bot.addCommand('markov', new Command(this.doMarkov.bind(this), 'markov'));

    this.f = this.onMessage.bind(this);
    this.bot.requestAllMessages(this.f);
  }
  
  deinit() {
    this.bot.cancelAllMessages(this.f);
  }

  doMarkov(input) {
    return new Promise((resolve, reject) => {
      if (!input.text) {
        reject('you must give some text for the markov chain to use');
        return;
      }

      let id = input.message.channel.id;
      let mkvReady;
      if (this.channelData.has(id)) {
        mkvReady = Promise.resolve(this.channelData.get(id));
      } else {
        let newMarkov = new MarkovChain();
        this.channelData.set(id, newMarkov);

        mkvReady = input.message.channel
          .fetchMessages({
            limit: this.numMessages
          })
          .then((m) => {
            return m.array();
          })
          .then((messages) => {
            messages
              .filter(msg => msg.content) // Don't do messages with no content
              .forEach((message) => {
                newMarkov.add(this.transform(message.cleanContent));
              });
          })
          .then(() => {
            return newMarkov;
          });
      }      

      mkvReady
        .then((mkv) => {
          let inStr = this.transform(input.text);
          let res = mkv.respond(inStr);

          if (res === inStr) {
            resolve('');
            return;
          }

          resolve(res);
        })
        .catch(reject);
    });
  }

  transform(text) {
    return text
      .replace(/[^\w-'"* ]+/g, '')
      .toLowerCase();
  }

  onMessage(message) {
    if (message.content) {
      let match = message.content.match(new RegExp(this.bot.discord.user.toString()));
      if (match) {
        let str;

        // Allow mentions everywhere, but strip them at the back/front
        let match = message.content.match(`^${this.bot.discord.user.toString()} (.+)`) || message.content.match(`(.+) ${this.bot.discord.user.toString()}$`);
        if (match) {
          str = match[1];
        } else {
          str = message.cleanContent; 
        }

        let input = new Input(message, this.bot, `~markov ${str}`);
        input.process()
          // Send successful result to the origin
          .then((result) => {
            if (result) {
              // Manually specify ID of Gunter
              // May move into config later
              if (message.author.id === '177964289091436544') {
                result = `${message.author.toString()} ${result}`;
                return message.channel.sendMessage(result, {disableEveryone: true});
              }

              return this.bot.send(message.channel, result);
            }
          })
          // Catch sending errors
          .catch((err) => {
            if (err) {
              this.error('Unable to send reply');
              this.error(err);
            }
          });
      }

      if (message.author.id === this.bot.discord.user.id) {
        return;
      }
      let id = message.channel.id;
      if (this.channelData.has(id)) {
        let mkv = this.channelData.get(id);
        mkv.add(this.transform(message.cleanContent));
      }
    }
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
   * @param {string} word Word to find the next of
   * 
   * @memberOf MarkovChain
   */
  next(word, tryContinue) {
    if (word === this.endString) {
      return '';
    }
    if (!this.pairs.has(word)) {
      return '';
    }

    let nexts = Array.from(this.pairs.get(word));

    if (tryContinue) {
      // Remove the end string if possible
      let filtered = nexts.filter(n => n[0] !== this.endString);
      if (filtered.length) {
        nexts = filtered;
      } else {
        // End string was the only thing, may as well early return
        return this.endString;
      }
    }

    let totalSize = nexts.reduce((total, curr) => {
      return total += curr[1].length;
    }, 0);
    let index =  Math.floor(Math.random() * totalSize);

    let fIndex = 0;
    while (index > nexts[fIndex][1].length) {
      index -= nexts[fIndex][1].length;
      fIndex++;
    }

    return nexts[fIndex][0];
  }

  /**
   * Creates a chain of the given length with the given starter
   * 
   * @param {string} start String to start with
   * @param {number} [length=20] Max length
   * @param {number} [min = 8] Min length (not guaranteed)
   * @returns
   * 
   * @memberOf MarkovChain
   */
  chain(start, length = 20, min = 8) {
    let outStr = start;

    let prev = start;
    for (var i = 0; i < length; i++) {
      let next = this.next(prev, i < 8);
      prev = next;
      if ((!next) || (next === this.endString)) {
        break;
      }
      outStr += ` ${next}`;
    }

    return outStr;
  }

  /**
   * Picks a word from the input string and generates from that
   * 
   * @param {string} text
   * 
   * @memberOf MarkovChain
   */
  respond(text) {
    let words = text.split(' ');

    let start = words[Math.floor(Math.random() * words.length)];
    return this.chain(start);
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

  /**
   * Dumps out the state of the current generator dictionary
   * 
   * @returns {Object}
   * 
   * @memberOf MarkovChain
   */
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
