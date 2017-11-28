import Addon from '../common/Addon';
import Input from '../common/Input';
import Command from '../common/Command';
import TextSendable from '../sendables/TextSendable';

export default class Latin extends Addon {
  id = 'latin';
  name = 'Latin';
  description = 'Adds some text transformations. Loosely inspired by the concept of "Pig Latin"';
  version = '9.0.0';

  constructor(bot) {
    super(bot);
  }

  async start() {
    // tslint:disable max-line-length
    this.addCommand(new Command('secret_latin', this.getSecretText, this));
    this.addCommand(new Command('trk_latin', this.getTrkText, this));
    this.addCommand(new Command('jaden_latin', this.getJadenText, this));
    this.addCommand(new Command('alvv_latin', this.getAlvvText, this));
    this.addCommand(new Command('ohdear_latin', this.getMessText, this));
    this.addCommand(new Command('ohfuck_latin', this.getFuckText, this));
    this.addCommand(new Command('wunter', this.getWunter, this));
    this.addCommand(new Command('blacklist_latin', this.getBlacklist, this));
    // tslint:enable max-line-length

    return true;
  }

  async getSecretText(input: Input) {
    return new TextSendable(this.getSecretLatin(input.text));
  }

  async getTrkText(input: Input) {
    return new TextSendable(this.getTrkLatin(input.text));
  }

  async getJadenText(input: Input) {
    return new TextSendable(this.toTitleCase(input.text));
  }

  async getAlvvText(input: Input) {
    return new TextSendable(this.getAlvvLatin(input.text));
  }

  async getMessText(input: Input) {
    const sendable = new TextSendable(`~secret_latin ~trk_latin ~jaden_latin ${input.text}`);
    return await this.bot.process(input.from(sendable));
  }

  async getFuckText(input: Input) {
    const sendable = new TextSendable(`~flip ~ohdear_latin ${input.text}`);
    return await this.bot.process(input.from(sendable));
  }

  async getWunter(input: Input) {
    const str = input.text.toLowerCase().replace(/[gr]/, 'w');
    return new TextSendable(str);
  }

  async getBlacklist(input: Input) {
    const words = input.args;
    const regex = new RegExp(`[${words.shift()}]`, 'g');

    const str = words
      .join(' ')
      .replace(regex, '');
    return new TextSendable(str);
  }

  /* "Latin" */
  getAlvvLatin(string) {
    const words = string.split(' ');
    for (let i = 0; i < words.length; i += 1) {
      // Don't replace Alvv's mention
      if (words[i].match(/<@!?\d+>/)) {
        words[i] = '<@83819945497985024>';
        continue;
      }
      if (words[i].length > 3) {
        if (words[i].indexOf('ing') === words[i].length - 3) {
          words[i] = 'alvving';
        } else if (words[i].indexOf('ed') === words[i].length - 2) {
          words[i] = 'alvved';
        } else if (words[i].indexOf('er') === words[i].length - 2) {
          words[i] = 'alvver';
        } else if (words[i].indexOf('n\'t') === words[i].length - 3) {
          words[i] = 'alvvn\'t';
        } else if (words[i].indexOf('nt') === words[i].length - 2) {
          words[i] = 'alvvnt';
        } else if (words[i].indexOf('\'s') === words[i].length - 2) {
          words[i] = 'alvv\'s';
        } else if (words[i].indexOf('es') === words[i].length - 2) {
          words[i] = 'alvves';
        } else if (words[i].indexOf('s') === words[i].length - 1) {
          words[i] = 'alvvs';
        } else if (words[i].indexOf('y') === words[i].length - 1) {
          words[i] = 'alvvy';
        } else {
          words[i] = 'alvv';
        }
      }
    }
    return words.join(' ');
  }

  getSecretLatin(string) {
    const words = string.split(' ');
    for (let i = 0; i < words.length; i += 1) {
      if (words[i].length > 2) {
        words[i] = words[i].substring(1, 2) + words[i].substring(0, 1) + words[i].substring(2);
      }
    }
    return words.join(' ');
  }

  getTrkLatin(string) {
    return string.replace(/[aeiouc]/gi, '');
  }

  /**
   * Quick title case
   */
  toTitleCase(str) {
    return str.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }
}
