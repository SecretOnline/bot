const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');
const Input = require('../bot/Input.js');
const Logger = require('../bot/Logger.js');
const {Override} = require('../bot/Input');

const cleverbot = require('cleverbot.io');
const {MarkovChain} = require('../util');

class ConversationAddon extends ScriptAddon {
  constructor(bot) {
    super(bot, 'conversation');

    this.desc = 'Uses various techniques to generate replies to messages';
    this.channelData = new Map();
    this.channelCB = new Map();
    this.numMessages = 100;
    this.gunter = 0;
    this.gunterLimit = 500;
    this.gunterInterval = null;
    this.markovChance = 0.3;
  }

  init() {
    this.addCommand('markov', this.doMarkov);
    this.addCommand('cb', this.doCleverbot);
    this.addCommand('gunter', this.startGunter);
     
    this.addCommand('clear-gunter', this.clearGunter, Command.PermissionLevels.OVERLORD);

    this.gunterInterval = setInterval(() => {
      if (this.gunter > 0) {
        this.gunter--;
        if (this.gunter === 0) {
          // Add some variation to the gunter limit
          this.gunterLimit = Math.floor(Math.random() * 100) + 450;
        }
      }
    }, 1000);
  }
  
  deinit() {
    clearInterval(this.gunterInterval);
  }

  doMarkov(input) {
    return new Promise((resolve, reject) => {
      if (!input.text) {
        reject('you must give some text for the markov chain to use');
        return;
      }

      let id = input.message.channel.id;
      let mkvReady;
      if (this.channelData.has(id)) {
        mkvReady = Promise.resolve(this.channelData.get(id));
      } else {
        let newMarkov = new MarkovChain(1000);
        this.channelData.set(id, newMarkov);

        mkvReady = this.bot
          .getLogs(Logger.filterByGuild(input.message.guild), 1000)
          .then((lines) => {
            return lines
              .map(l => l.message)
              .filter(l => l);
          })
          .then((messages) => {
            messages.forEach((message) => {
              newMarkov.add(this.transform(message));
            });
          })
          .then(() => {
            return newMarkov;
          });
      }      

      mkvReady
        .then((mkv) => {
          let inStr = this.transform(input.text);
          let res = mkv.respond(inStr);

          if (res === inStr) {
            resolve('');
            return;
          }

          resolve(res);
        })
        .catch(reject);
    });
  }

  doCleverbot(input) {
    return new Promise((resolve, reject) => {
      if (!input.text) {
        reject('you must give some text for cleverbot to use');
        return;
      }

      let id = input.message.channel.id;
      let cbReady;
      if (this.channelCB.has(id)) {
        cbReady = Promise.resolve(this.channelCB.get(id));
      } else {
        let conf = this.getConfig('default').cb;
        let newBot = new cleverbot(conf.user, conf.key);
        newBot.setNick(`s_b-${id}`);

        cbReady = new Promise((resolve2, reject2) => {
          newBot.create((err, session) => {
            if (err) {
              reject2(err);
              return;
            }

            this.channelCB.set(id, newBot);
            resolve2(newBot);
          });
        });
      }

      cbReady
          .then((cb) => {
            let inStr = this.transform(input.text);
            cb.ask(inStr, (err, response) => {
              if (err) {
                reject(err);
                return;
              }
              resolve(response.toLowerCase());
            });
          });
    });
  }

  startGunter(input) {
    input.message.channel.sendMessage(`<@177964289091436544> ${input.text}`);
    return '';
  }

  clearGunter(input) {
    this.gunter = 0;
    return 'it\'s time to gunter again!';
  }

  transform(text) {
    return text
      .replace(/[^\w-'"* ]+/g, '')
      .toLowerCase();
  }

  onMessage(message) {
    if (message.content) {
      // Allow mentions everywhere, but strip them at the back/front
      let match = message.content.match(`^<@!?${this.bot.discord.user.id}> (.+)`) || message.content.match(`(.+) <@!?${this.bot.discord.user.id}>$`);
      if (match) {
        let str;

        let isGunter = (message.author.id === '177964289091436544');

        if (isGunter) {
          if (this.gunter > this.gunterLimit) {
            return;
          }

          this.gunter += 50;
        }

        let command = Math.random() > this.markovChance ? 'markov' : 'cb';

        let input = new Input(message, this.bot, null, new Override(`~${command} ${str}`));
        input.process()
          // Send successful result to the origin
          .then((result) => {
            if (result.text) {
              if (isGunter) {
                result = `${message.author.toString()} ${result.text}`;
                return message.channel.sendMessage(result.text, {disableEveryone: true});
              }

              return this.bot.send(message.channel, result.text);
            }
          })
          // Catch sending errors
          .catch((err) => {
            if (err) {
              this.error('Unable to send reply');
              this.error(err);
            }
          });
      }

      if (message.author.id === this.bot.discord.user.id) {
        return;
      }
      let id = message.channel.id;
      if (this.channelData.has(id)) {
        let mkv = this.channelData.get(id);
        mkv.add(this.transform(message.cleanContent));
      }
    }
  }
}

module.exports = ConversationAddon;
