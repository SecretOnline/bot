import { arrayRandom } from '../util';

type MarkovItemType = 'word' | 'nospacebefore' | 'nospaceafter' | 'end';

interface MarkovToken {
  value: string;
  type: MarkovItemType;
}

interface MarkovItem extends MarkovToken {
  next: Map<string | MarkovItem, number[]>;
}

interface ChainOptions {
  length: number;
  min: number;
  allowWrapped: boolean;
}

const endItem: MarkovItem = {
  value: '',
  next: null,
  type: 'end',
};

export default class MarkovChain {
  private readonly size: number;
  private index = 0;
  private isWrapped = false;

  private defaultLength = 20;
  private minLength = 8;
  private innerLength = 8;

  private readonly defaultOpts: ChainOptions = {
    length: this.defaultLength,
    min: this.minLength,
    allowWrapped: true,
  };

  private items = new Map<string, MarkovItem>();

  constructor(size = 1000) {
    this.size = size;
  }

  next(word: MarkovItem, avoidEnd: boolean) {
    let nexts = Array.from(word.next.entries());

    if (avoidEnd) {
      nexts = nexts.filter(n => typeof n[0] === 'string');
    }

    const total = nexts.reduce((p, c) => p + c[1].length, 0);

    // Randomly select a value
    let val = Math.random() * total;

    // Loop through array until randomly chosen value is reached
    for (let i = 0; i < nexts.length; i += 1) {
      const item = nexts[i];

      // Decrease val
      val -= item[1].length;
      // If ithin current item's range
      if (val < item[1].length) {
        // If it's an item (i.e. the end token), return it
        if (typeof item[0] === 'string') {
          return <MarkovItem>item[0];
        }

        // Find item and return it
        const token = <string>item[0];
        if (this.items.has(token)) {
          return this.items.get(token);
        }

        // Return end as default
        return endItem;
      }
    }

    return endItem;
  }

  chain(start: MarkovItem, opts = this.defaultOpts) {
    const fullOpts: ChainOptions = {
      ...this.defaultOpts,
      ...opts,
    };
    const { length, min } = fullOpts;

    const itemArr: MarkovItem[] = [];

    let prev = start;
    for (let i = 0; i < length; i += 1) {
      const next = this.next(prev, i < min);
      prev = next;
      if ((!next) || (next.type === 'end')) {
        break;
      }

      itemArr.push(next);
    }

    // Turn array into string, respecting space hints in item types
    let outStr = '';
    for (let i = 0; i < itemArr.length; i += 1) {
      let space;
      if (
        i === 0 ||
        itemArr[i].type === 'nospacebefore' ||
        itemArr[i - 1].type === 'nospaceafter'
      ) {
        space = '';
      } else {
        space = ' ';
      }

      outStr += `${space}${itemArr[i].value}`;
    }

    return outStr;
  }

  respond(text: string) {
    const words = text.split(' ');
    const start = arrayRandom(words);
    const token = this.get(start);
    if (!token) {
      return '';
    }
    return this.chain(token);
  }

  get(value: string) {
    return this.items.get(value);
  }

  add(text: string) {
    const tokens = MarkovChain.tokenize(text);

    // Group tokens into pairs
    const pairs = tokens.map((word, index) => {
      let next: MarkovToken;
      if (index === tokens.length - 1) {
        next = endItem;
      } else {
        next = tokens[index + 1];
      }
      return [word, next];
    });

    pairs.forEach((pair) => {
      if (!this.items.has(pair[0].value)) {
        this.items.set(pair[0].value, {
          ...pair[1],
          next: new Map(),
        });
      }

      const valMap = this.items.get(pair[0].value).next;
      // Add curent index to list (for removal purposes later)
      if (valMap.has(pair[1].value)) {
        // Add this index to the list
        valMap.get(pair[1].value).push(this.index);
      } else {
        valMap.set(pair[1].value, [this.index]);
      }
    });

    // Do removal only if needed
    if ((this.items.size >= this.size) || this.isWrapped) {
      let oldIndex = this.index - this.size;
      if (oldIndex < 0) {
        oldIndex += Number.MAX_SAFE_INTEGER;
      }

      // For every start word
      for (const [word, nextItems] of this.items) {
        for (const [next, indicies] of nextItems.next) {
          // Remove all instances of the old index
          while (indicies.indexOf(oldIndex) > -1) {
            indicies.splice(indicies.indexOf(oldIndex), 1);
          }

          // Remove unneeded exits
          if (indicies.length === 0) {
            nextItems.next.delete(next);
          }
        }

        // Remove unneeded entries
        if (nextItems.next.size === 0) {
          this.items.delete(word);
        }
      }
    }

    this.index += 1; // Increment index
    if (this.index >= Number.MAX_SAFE_INTEGER) { // And make sure it won't go wrong
      this.index = 0;
      this.isWrapped = true;
    }
  }

  static tokenize(str: string) {
    // Based off util/quoteSplit(), but expanded for markov use
    const arr: MarkovToken[] = [];
    const exp = /(?:(["`({[\]})])|([^"`({[][^\s,.!?"'\]})`]*))\s*/g;

    let quoteState = false;
    let dQuoteState = false;

    let item = exp.exec(str);
    while (item !== null) {
      const value = item[1] || item[2];

      // Determine type of token
      let type: MarkovItemType = 'word';
      switch (value) {
        // Toggle quote state
        case '\'':
          type = quoteState ? 'nospaceafter' : 'nospacebefore';
          quoteState = !quoteState;
          break;
        case '"':
          type = dQuoteState ? 'nospaceafter' : 'nospacebefore';
          dQuoteState = !dQuoteState;
          break;
        // Normal punctuation
        case '.':
        case ',':
        case '?':
        case '!':
          type = 'nospacebefore';
      }

      const token: MarkovToken = {
        value,
        type,
      };
      arr.push(token);

      item = exp.exec(str);
    }

    return arr;
  }
}
