import Addon from '../common/Addon';
import Input from '../common/Input';
import Command from '../common/Command';
import AnimationSendable from '../sendables/AnimationSendable';
import TextSendable from '../sendables/TextSendable';
import AddonError from '../errors/AddonError';
import { arrayRandom } from '../util';


// tslint:disable max-line-length
const sayHelp = [
  'syntax: `~<say/raw> <text to output>`',
  'takes some text, and outputs it',
  '`~say` processes the text, while `~raw` does not',
  'example usage:',
  '~say ~lenny',
  '~raw ~lenny',
].join('\n');
const rollHelp = [
  'syntax: `~roll <roll> [more rolls]`',
  'where a roll is in the format `ndm`, `n` being the number of dice to roll, and `m` being the magnitude of the dice',
  'example usage:',
  '~roll 4d6',
  '~roll 1d20',
].join('\n');
const unReverseHelp = 'takes a reversed string and puts it the right way around';
const reverseHelp = 'takes a string and reverses the letter order';
const randomHelp = [
  'syntax: `~random <option> <option> [more options]`',
  'selects one of the options given in the list',
  'example usage:',
  '~random Imperial Stormcloak',
  '~random "Procrastinate for a few hours" "Add commands to secret_bot" Study',
].join('\n');
const flipHelp = [
  'this command will flip any text upside down',
  '(not all characters work just yet. soon(tm))',
  'this is caused by Unicode not having upside down versions of all characters, and don\'t expect them to be added any time soon',
  'example usage:',
  '`~flip example text`',
  '`~flip ~dance`',
].join('\n');
const eightBallHelp = [
  'syntax: `~eightball <yes/no question>`',
].join('\n');
// tslint:enable

export default class Comm extends Addon {
  id = 'commands';
  name = 'Commands';
  description = 'Contains some basic and useful commands';
  version = '9.0.0';

  constructor(bot) {
    super(bot);
  }

  async start() {
    this.addCommand(new Command('say', this.parrot, this, { help: sayHelp }));
    this.addCommand(new Command('raw', this.parrot, this, { help: sayHelp, useRaw: true }));
    this.addCommand(new Command('roll', this.getRoll, this, { help: rollHelp }));
    this.addCommand(new Command('reverse', this.reverse, this, { help: reverseHelp }));
    this.addCommand(new Command('unreverse', this.reverse, this, { help: unReverseHelp }));
    this.addCommand(new Command('random', this.random, this, { help: randomHelp }));
    this.addCommand(new Command('flip', this.getFlip, this, { help: flipHelp }));
    this.addCommand(new Command('eightball', this.getEightball, this, { help: eightBallHelp }));

    return true;
  }

  async parrot(input: Input) {
    return new TextSendable(input.text);
  }

  /*
   * Reverse taken from https://github.com/mathiasbynens/esrever/blob/master/src/esrever.js
   * to deal with javascript's unicode encoding (at least part of it)
   */
  async reverse(input: Input) {
    const regexSurrogatePair = /([\uD800-\uDBFF])([\uDC00-\uDFFF])/g;
    const text = input.text
      // Swap high and low surrogates so the low surrogates go first
      .replace(regexSurrogatePair, '$2$1');
    // Step 2: reverse the code units in the string
    let ret = '';
    let index = text.length;
    while (index -= 1) {
      ret += text.charAt(index);
    }
    return new TextSendable(ret);
  }

  async getRoll(input: Input) {
    const dice = input.args
      .filter(r => r.match(/^\d+d\d+$/));

    if (dice.length === 0) {
      // tslint:disable-next-line max-line-length
      throw new AddonError(this, 'you just include a roll in your message. see `~help roll` for more information');
    }

    const rollResults = dice
      .map((roll) => {
        const [numStr, magStr] = roll.split('d');
        const num = Number.parseInt(numStr);
        const mag = Number.parseInt(magStr);

        const values = [];
        for (let i = 0; i < num; i += 1) {
          values.push(Math.floor(Math.random() * mag) + 1);
        }

        return values;
      });

    const total = rollResults.reduce(
      (total, current) => {
        return total + current.reduce((a, b) => a + b, 0);
      },
      0,
    );
    const rolls = rollResults.reduce(
      (all, current) => {
        return all.concat(current);
      },
      [],
    );

    return new TextSendable(`${total} (${rolls.join('+')})`);
  }

  async random(input: Input) {
    return new TextSendable(arrayRandom(input.args));
  }

  async getFlip(input: Input) {
    return new TextSendable(this.flip(input.text));
  }

  flip(aString: string) {
    const last = aString.length - 1;
    const result = [];
    for (let i = last; i >= 0; i -= 1) {
      const c = aString.charAt(i);
      const r = flipTable[c];
      result[last - i] = r !== undefined ? r : c;
    }
    return result.join('');
  }

  async getEightball(input: Input) {
    const resText = `${eightballFrames[0]} ${arrayRandom(eightBallResponses)}`;

    return new AnimationSendable(
      [
        ...eightballFrames,
        resText,
      ],
      EIGHTBALL_DELAY,
      resText,
    );
  }
}

// tslint:disable comment-format object-literal-key-quotes
const flipTable = {
  a: '\u0250',
  b: 'q',
  c: '\u0254',
  d: 'p',
  e: '\u01DD',
  f: '\u025F',
  g: '\u0183',
  h: '\u0265',
  i: '\u0131',
  j: '\u027E',
  k: '\u029E',
  l: '\u05DF',
  m: '\u026F',
  n: 'u',
  r: '\u0279',
  t: '\u0287',
  v: '\u028C',
  w: '\u028D',
  y: '\u028E',
  '.': '\u02D9',
  '[': ']',
  '(': ')',
  '{': '}',
  '?': '\u00BF',
  '!': '\u00A1',
  '\'': ',',
  '<': '>',
  '_': '\u203E',
  '"': '\u201E',
  '\\': '\\',
  ';': '\u061B',
  '\u203F': '\u2040',
  '\u2045': '\u2046',
  '\u2234': '\u2235',
  'A': '∀',
  'B': '\u029A',
  'C': '\u0186',
  'D': '\u2C6D',
  'E': '\u018E',
  //'F': '',
  //'G': '',
  //'J': '',
  //'K': '',
  'L': '˥',
  'M': 'W',
  'P': '\u0500',
  //'Q': '',
  'R': '\u1D1A',
  'T': '\u2534',
  'U': '\u2229',
  'V': '\u039B',
  'Y': '\u03BB',
  '（': '）',
  '☜': '☞',
  '˳': '°',
  '⌐': '¬',
  '┌': '┘',
  '┐': '└',
  '͜': '͡',
  'ʕ': 'ʖ',
};
// tslint:enable
for (const i in flipTable) {
  flipTable[flipTable[i]] = i;
}

const eightBallResponses = [
  'It is certain',
  'It is decidedly so',
  'Without a doubt',
  'Yes definitely',
  'You may rely on it',
  'As I see it, yes',
  'Most likely',
  'Outlook good',
  'Yes',
  'Signs point to yes',
  'Reply hazy, try again',
  'Ask again later',
  'Better not tell you now',
  'Cannot predict now',
  'Concentrate and ask again',
  'Don\'t count on it',
  'My reply is no',
  'My sources say no',
  'Outlook not so good',
  'Very doubtful',
];
const eightballColor = '#292F33';
const eightballFrames = [
  '🎱⚫⚫',
  '⚫🎱⚫',
  '⚫⚫🎱',
  '⚫🎱⚫',
  '🎱⚫⚫',
];
const EIGHTBALL_DELAY = 1000;
