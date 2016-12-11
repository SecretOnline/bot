const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');
const request = require('../util/request.js');

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
  }

  init() {
    this.bot.addCommand('theuselessweb', new Command(this.uselessWeb.bind(this), 'randomstuff', uselessHelp));
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

  uselessWeb(imput) {
    if (!this.uselessWebTimeout) {
      this.loadUselessWeb();
    }

    if (this.theuselessweb.length === 0) {
      throw new Error('secret_bot is still loading The Useless Web');
    }

    let entry = this.theuselessweb[Math.floor(Math.random() * this.theuselessweb.length)];

    let res = entry[0];
    if (entry[1]) {
      res += ' (requires Flash)';
    }

    return res;
  }
}

module.exports = RandomStuff;
