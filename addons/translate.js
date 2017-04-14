const translate = require('google-translate');

const ScriptAddon = require('../bot/ScriptAddon.js');

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
  }
}

module.exports = Translate;
