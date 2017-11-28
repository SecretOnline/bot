import * as translate from 'google-translate';

import Addon, { IAddonConfig } from '../common/Addon';
import Input from '../common/Input';
import Command from '../common/Command';
import TextSendable from '../sendables/TextSendable';
import AnimationSendable from '../sendables/AnimationSendable';
import WrapperError from '../errors/WrapperError';

import { arrayRandom } from '../util';

const translateHelp = [
  'syntax: `~translate [from] [to] <text>`',
  'translates text from one language to another',
  '`[from]` defaults to automatic',
  '`[to]` defaults to `en`',
].join('\n');
const translatePartyHelp = [
  'syntax: `~translate [from] [to] <text>`',
  'translates text between multiple languages',
  'it\'s like Chinese Whispers (telephone, in the US), but with machine learning',
].join('\n');

interface TranslateConfig extends IAddonConfig {
  gapi: string;
}

export default class Translate extends Addon {
  id = 'translate';
  name = 'Translate';
  description = 'Allows secret_bot to translate messages';
  version = '9.0.0';

  private translator;
  private getLangs: Promise<string[]>;
  private translateColor = '#4A8CF7';
  private translateDelay = 2000;
  private partyNumLangs = 8;

  constructor(bot) {
    super(bot);
  }

  async start(conf: TranslateConfig) {
    // tslint:disable max-line-length
    this.addCommand(new Command('translate', this.translate, this, { help: translateHelp }));
    this.addCommand(new Command('translateparty', this.translateParty, this, { help: translatePartyHelp }));
    // tslint:enable max-line-length

    this.translator = translate(conf.gapi);
    this.getLangs = new Promise((resolve, reject) => {
      this.translator.getSupportedLanguages((err, langs: string[]) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(langs);
      });
    });

    return true;
  }

  doTranslation(from: string, to: string, str: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const cb = (err, translation) => {
        if (err) {
          reject(new WrapperError(err));
          return;
        }

        resolve(translation.translatedText);
      };

      if (from) {
        this.translator.translate(str, from, to, cb);
      } else {
        this.translator.translate(str, to, cb);
      }
    });
  }

  async translate(input: Input) {
    const langs = await this.getLangs;
    const args = input.args;
    let from;
    let to = 'en';

    if (args[0].length === 2) {
      if (args[1].length === 2) {
        if (langs.includes(args[0]) && langs.includes(args[1])) {
          from = args[0];
          to = args[1];
          args.splice(0, 2);
        } else {
          throw `${args[0]} and ${args[1]} are not valid language codes`;
        }
      } else {
        if (langs.includes(args[0])) {
          to = args[0];
          args.splice(0, 1);
        } else {
          throw `${args[0]} is not a valid language code`;
        }
      }
    }

    const str = await this.doTranslation(from, to, args.join(' '));
    return new TextSendable(str);
  }

  async translateParty(input: Input) {
    const langs = await this.getLangs;
    // Starting and ending with English, do languages
    const languages: string[] = [];
    languages.push('en');
    for (let i = 0; i < this.partyNumLangs; i += 1) {
      const filteredLangs = langs.filter(l => l !== languages[i]);
      languages.push(arrayRandom(filteredLangs));
    }
    languages.push('en');

    const pairs = languages
      .map((lang, index) => {
        return [lang, languages[index + 1]];
      })
      .slice(0, -1);

    const translateFunctions = pairs.map((pair) => {
      return (str: string) => this.doTranslation(pair[0], pair[1], str);
    });

    // Modified version of promiseChain util function
    const animPromises: Promise<string>[] = [];
    translateFunctions.reduce(
      (prom, nextFunc, index) => {
        // First: do translations in order
        const transProm = prom
          .then(res => nextFunc(res));

        const formatProm = transProm
          .then((text) => {
            const breadcrumbs = languages
              .slice(0, index + 2)
              .join(' > ');

            return `**${breadcrumbs}**\n\n${text}`;
          });
        animPromises.push(formatProm);

        return transProm;
      },
      Promise.resolve(input.text),
    );

    return new AnimationSendable(animPromises);
  }
}
