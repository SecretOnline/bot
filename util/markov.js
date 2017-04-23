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
    let words = text.split(/\s+/);
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

  /**
   * Splits a string into a list of tokens for use with the MarkovChain
   *
   * @static
   * @param {string} str String to split
   * @returns {Array} List of tokens
   *
   * @memberOf MarkovChain
   */
  static tokenize(str) {
    // Based off util/quoteSplit(), but expanded for markov use
    let arr = [];
    let exp = /(?:([^"`({[][^\s,.!?]*)|\"(.*?)\"|\`(.*?)\`|\((.*?)\)|\[(.*?)\]|\{(.*?)\})\s*/g;

    let item = exp.exec(str);
    while (item !== null) {
      let token;
      let type;
      if (item[1]) {
        token = item[1];
        type = 'word';
      } else if (item[2]) {
        token = item[2];
        type = 'doublequote';
      } else if (item[3]) {
        token = item[3];
        type = 'backquote';
      } else if (item[4]) {
        token = item[4];
        type = 'bracket';
      } else if (item[5]) {
        token = item[5];
        type = 'squarebracket';
      } else if (item[6]) {
        token = item[6];
        type = 'brace';
      }
      arr.push({
        type,
        token
      });

      item = exp.exec(str);
    }

    return arr;
  }
}

module.exports = MarkovChain;
