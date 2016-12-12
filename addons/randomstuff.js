const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');
const request = require('../util/').request;

let uselessHelp = [
  'Gives you a random website from The Useless Web',
  'Original site: http://www.theuselessweb.com/'
];

class RandomStuff extends ScriptAddon {
  constructor(bot) {
    super(bot, 'core');

    this.theuselessweb = [];
    this.uselessWebTimeout = false;
    this.loadUselessWeb();

    this.mahnaStage = 0;
  }

  init() {
    this.bot.addCommand('theuselessweb', new Command(this.uselessWeb.bind(this), 'randomstuff', uselessHelp));
    this.bot.addCommand('randomcat', new Command(this.randomCat.bind(this), 'randomstuff'));
    this.bot.addCommand('randomdog', new Command(this.randomDog.bind(this), 'randomstuff'));
    this.bot.addCommand('mahnamahna', new Command(this.mahnamahna.bind(this), 'randomstuff', 'https://www.youtube.com/watch?v=8N_tupPBtWQ'));
  }

  deinit() {
    // Do nothing
  }

  loadUselessWeb() {
    request('http://www.theuselessweb.com/js/uselessweb.js?v=1')
      .then((res) => {
        let match = res.match(/sitesList = (\[[\w\W\r\n]*?\]);/);
        if (match) {
          try {
            let m = match[1].replace(/'/g, '"');
            this.theuselessweb = JSON.parse(m);
          } catch (e) {
            // do nothing on error
          }
        }
      }, (err) => {
        console.log(err); // eslint-disable-line no-console
      });
    this.uselessWebTimeout = setTimeout(() => {
      this.uselessWebTimeout = false;
    }, 43200000);
  }

  uselessWeb(input) {
    if (!this.uselessWebTimeout) {
      this.loadUselessWeb();
    }

    if (this.theuselessweb.length === 0) {
      throw new Error('secret_bot is still loading The Useless Web');
    }

    let arr = this.theuselessweb;

    // TODO: Add option to have flash enabled pages too
    arr = this.theuselessweb.filter(i => !i[1]);

    let entry = arr[Math.floor(Math.random() * arr.length)];

    let res = entry[0];
    if (entry[1]) {
      res += ' (requires Flash)';
    }

    return res;
  }

  randomCat(input) {
    return request('http://random.cat/meow')
      .then(JSON.parse)
      .then((res) => {
        return res.file;
      });
  }

  randomDog(input) {
    return request('http://random.dog')
      .then((res) => {
        let match = res.match(/<img src='([\w-_.]+\.\w+)'/);
        if (match) {
          return `http://random.dog/${match[1]}`;
        }
      });
  }

  mahnamahna(input) {
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

    return res;
  }
}

module.exports = RandomStuff;
