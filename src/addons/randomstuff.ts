import { format } from 'url';
import * as r2 from 'r2';

import Addon, { IAddonConfig } from '../common/Addon';
import Input from '../common/Input';
import Command from '../common/Command';
import TextSendable from '../sendables/TextSendable';
import SectionedSendable from '../sendables/SectionedSendable';
import AddonError from '../errors/AddonError';
import WrapperError from '../errors/WrapperError';

import { arrayRandom } from '../util';
import { resolve } from 'path';

interface UselessItem {
  0: string;
  1: boolean;
}

interface DongerPart {
  character: string;
  category: string;
  orientation?: string;
  opposite?: string;
}

interface DongerCheck {
  option: string;
  value: string;
}

interface DongerBit {
  l: string;
  r: string;
}

interface DongerBuilder {
  body: DongerBit;
  eyes: DongerBit;
  mouth: DongerBit;
  cheeks?: DongerBit;
  arms?: DongerBit;
}

export default class RandomStuff extends Addon {
  id = 'randomstuff';
  name = 'Random Stuff';
  description = 'Either things that are random, or things that use random';
  version = '9.0.0';

  private timeout = 1000 * 60 * 60 * 24 * 2;

  private theuselessweb: UselessItem[];
  private uselessWebTimeout;

  private dongerParts = new Map<string, DongerPart[]>();
  private dongersTimeout;

  private mahnaStage = 0;

  constructor(bot) {
    super(bot);
  }

  async start() {
    // tslint:disable max-line-length
    this.addCommand(new Command('theuselessweb', this.uselessWeb, this));
    this.addCommand(new Command('randomcat', this.randomCat, this));
    this.addCommand(new Command('randomdog', this.randomDog, this));
    this.addCommand(new Command('mahnamahna', this.mahnamahna, this));
    this.addCommand(new Command('httpcat', this.httpcat, this));
    this.addCommand(new Command('randomdonger', this.randomDonger, this));
    this.addCommand(new Command('inspirobot', this.inspirobot, this));
    // tslint:enable max-line-length

    return true;
  }

  async loadUselessWeb() {
    const script = await r2.get('http://www.theuselessweb.com/js/uselessweb.js?v=2').text;

    const match = script.match(/sitesList = (\[[\w\W\r\n]*?\]);/);
    if (!match) {
      throw new AddonError(this, 'unable to load Useless Web');
    }

    const str = match[1]
      .replace(/'/g, '"') // Replace single quotes
      .replace(/\/\/ \[.*\r?\n/g, ''); // Remove commented lines

    this.theuselessweb = JSON.parse(str);

    this.uselessWebTimeout = setTimeout(
      () => {
        this.uselessWebTimeout = false;
      },
      this.timeout,
    );

    return this.theuselessweb;
  }

  async loadDongers() {
    const promises = [
      'arms',
      'body',
      'cheeks',
      'eyes',
      'mouth',
      'accessories',
    ]
      .map((part) => {
        return r2.get(`http://dongerlist.com/wp-content/themes/dongerlist/json/${part}.json`).json
          .then((partList: DongerPart[]) => {
            this.dongerParts.set(part, partList);
            return partList;
          });
      });

    await Promise.all(promises);

    this.dongersTimeout = setTimeout(
      () => {
        this.dongersTimeout = false;
      },
      this.timeout,
    );

    return this.dongerParts;
  }

  async getUselessWeb() {
    if (this.uselessWebTimeout) {
      return this.theuselessweb;
    } else {
      return this.loadUselessWeb();
    }
  }

  async getDongers() {
    if (this.dongersTimeout) {
      return this.dongerParts;
    } else {
      return this.loadDongers();
    }
  }

  async uselessWeb(input: Input) {
    const pages = await this.getUselessWeb();
    const noFlash = pages.filter(i => !i[1]);

    const result = arrayRandom(noFlash);

    return new TextSendable(result[0]);
  }

  async randomCat(input: Input) {
    const response = await r2.get('http://aws.random.cat/meow').json;
    return new TextSendable(response.file);

    // TODO: ReActions
  }

  async randomDog(input: Input) {
    const response = await r2.get('http://random.dog/woof').text;
    return new TextSendable(`http://random.dog/${response}`);

    // TODO: ReActions
  }

  async mahnamahna(input: Input) {
    let res;

    switch (this.mahnaStage) {
      case 0:
        res = 'doo *dooooo* do do doo';
        break;
      case 1:
        res = 'doo do do *doo*';
        break;
      case 2:
        res = 'doo *dooooo* do do doo. do do doo. do do doo. do do do do do *doo doo dooooo* do';
        break;
      default:
        res = 'you broke it';
    }

    this.mahnaStage = (this.mahnaStage + 1) % 3;

    return new TextSendable(res);
  }

  async httpcat(input: Input) {
    // regex generated from list of status codes that are allowed
    // tslint:disable-next-line:max-line-length
    const match = input.text.match(/^10[01]|20[0-2467]|30[0-57]|4(?:44|31|2[0-69]|1[0-8]|0[0-689]|5[01])|5(?:99|0[02-46-9]|11)$/);
    if (!match) {
      throw new AddonError(this, `${input.text} is not an HTTP status code`);
    }

    return new TextSendable(`https://http.cat/${input.text}.jpg`);
  }

  randomDongerPart(type: string, check?: DongerCheck): DongerBit {
    // Code adapted from http://dongerlist.com/create-donger
    // Will hold filtered parts
    let parts: DongerPart[];

    // Get a list of parts of this type
    if (check) {
      parts = this.dongerParts
        .get(type)
        .filter((part) => {
          if (part[check.option] === check.value || part[check.option] === 'both') {
            return true;
          }
        });
    } else {
      // No need to check anything (except for eyes)
      if (type === 'eyes') {
        parts = this.dongerParts
          .get(type)
          .filter((part) => {
            // Only grab the left and both-sided eyes
            if (part.orientation === 'left' || part.orientation === 'both') {
              return true;
            }
          });
      } else {
        // Make a copy of the array, to avoid mutation
        parts = this.dongerParts
          .get(type)
          .slice();
      }
    }

    const tempPart = arrayRandom(parts);
    // If this part has an opposite, add it in
    if (tempPart.opposite) {
      return {
        l: tempPart.character,
        r: tempPart.opposite,
      };
    } else {
      const retObj = {
        l: tempPart.character,
        r: '',
      };
      // If arm with no opposite, pick a random arm
      if (type === 'arms') {

        // Filter for right-sided arms
        parts = this.dongerParts
          .get(type)
          .filter((part) => {
            if (part.orientation === 'right' ||
              part.orientation === 'both') {
              return true;
            }
          });

        retObj.r = arrayRandom(parts).character;
      }

      return retObj;
    }
  }

  buildDonger() {
    // This code is adapted from http://dongerlist.com/create-donger
    // Get our parts together
    const builder: DongerBuilder = {
      body: this.randomDongerPart('body', {
        option: 'orientation',
        value: 'left',
      }),
      eyes: this.randomDongerPart('eyes'),
      mouth: this.randomDongerPart('mouth'),
    };

    // Probabilities for other parts
    const number = Math.floor(Math.random() * 12);
    // 1/3 change to include cheeks
    // (I don't like cheeks that much)
    if (number % 3 === 0) {
      builder.cheeks = this.randomDongerPart('cheeks');
    }
    // 1/4 to not include arms
    // (I like arms)
    if (number % 4 !== 0) {
      builder.arms = this.randomDongerPart('arms', {
        option: 'orientation',
        value: 'left',
      });
    }

    // Build from the builder
    let str = `${builder.eyes.l} ${builder.mouth.l} ${builder.eyes.r}`;
    if (builder.cheeks) {
      str = `${builder.cheeks.l} ${str} ${builder.cheeks.r}`;
    }
    str = `${builder.body.l} ${str} ${builder.body.r}`;
    if (builder.arms) {
      str = `${builder.arms.l}${str}${builder.arms.r}`;
    }

    return str;
  }

  async randomDonger(input: Input) {
    // Ensure dongers are actually in cache
    await this.getDongers();

    return new TextSendable(this.buildDonger());
  }

  async inspirobot(input: Input) {
    const img = await r2.get('http://inspirobot.me/api?generate=true').text;
    return new TextSendable(img);
  }
}
