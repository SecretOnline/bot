const translate = require('google-translate');

const ScriptAddon = require('../bot/ScriptAddon.js');
const Animation = require('../bot/Animation.js');

const {arrayRandom} = require('../util');

const translateHelp = [];
const translatePartyHelp = [];


class Translate extends ScriptAddon {
  constructor(bot) {
    super(bot, 'translate');

    let conf = this.getConfig();

    this.translator = translate(conf.key);
    this.getLangs = new Promise((resolve, reject) => {
      this.translator.getSupportedLanguages((err, langs) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(langs);
      });
    });

    this.translateColor = '#4A8CF7';
    this.translateDelay = 2000;
    this.partyNumLangs = 8;
  }

  get description() {
    return 'Allows secret_bot to translate messages';
  }

  init() {
    this.addCommand('translate', this.translate, translateHelp);
    this.addCommand('translateparty', this.translateParty, translatePartyHelp);
  }

  doTranslation(from, to, str) {
    return new Promise((resolve, reject) => {
      let cb = (err, translation) => {
        if (err) {
          reject(err);
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

  translate(input) {
    return Promise.all([
      input.process(),
      this.getLangs
    ])
      .then(([res, langs]) => {
        let from;
        let to = 'en';
        let args = res.args;

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

        return this.doTranslation(from, to, args.join(' '));
      });
  }

  translateParty(input) {
    return Promise.all([
      input.process(),
      this.getLangs
    ])
      .then(([res, langs]) => {
        // Starting and ending with English, do languages
        let languages = [];
        languages.push('en');
        for (let i = 0; i < this.partyNumLangs; i++) {
          let filteredLangs = langs.filter(l => l !== languages[i]);
          languages.push(arrayRandom(filteredLangs));
        }
        languages.push('en');

        let pairs = languages
          .map((lang, index) => {
            return [lang, languages[index + 1]];
          })
          .slice(0, -1);
        
        let translateFunctions = pairs.map((pair) => {
          return (str) => this.doTranslation(pair[0], pair[1], str);
        });

        // Modified version of promiseChain util function
        let animPromises = [];
        translateFunctions
          .reduce((prom, nextFunc, index) => {
            // First: do translations in order
            let transProm = prom
              .then(res => nextFunc(res));
            
            let formatProm = transProm
              .then((text) => {
                let breadcrumbs = languages
                  .slice(0, index + 2)
                  .join(' > ');

                return `**${breadcrumbs}**\n\n${text}`;
              });
            animPromises.push(formatProm);
            
            return transProm;
          }, Promise.resolve(res.text));
        
        res.add(new Animation(animPromises, this.translateDelay, this.translateColor));
        res.add('');
        return res;
      });
  }
}

module.exports = Translate;
