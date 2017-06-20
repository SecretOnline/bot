const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');
const Input = require('../bot/Input.js');
const Logger = require('../bot/Logger.js');
const {Override} = require('../bot/Input');

const cleverbot = require('cleverbot.io');
const {MarkovChain, Cooldown, delay, embedify} = require('../util');

const embedColor = '#FAD188';

class ConversationAddon extends ScriptAddon {
  constructor(bot) {
    super(bot, 'conversation');

    this.channelData = new Map();
    this.channelCB = new Map();
    this.numMessages = 100;

    this.gunterLimits = new Map();
    this.gunterLimit = 500000;
    this.gunterBump =   50000;
  }

  get description() {
    return 'Uses various techniques to generate replies to messages';
  }

  init() {
    this.addCommand('markov', this.doMarkov);
    this.addCommand('cb', this.doCleverbot);
    this.addCommand('gunter', this.startGunter);

    this.addCommand('clear-gunter', this.clearGunter, Command.PermissionLevels.OVERLORD);
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
              newMarkov.add(message);
            });
          })
          .then(() => {
            return newMarkov;
          });
      }

      mkvReady
          .catch((err) => {
            this.error('failed to create markov');
            this.error(err);

            reject(err);
          })
        .then((mkv) => {
          let res = mkv.respond(input.text);

          if (res === input.text) {
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
          .catch((err) => {
            this.error('failed to create cb');
            this.error(err);

            reject(err);
          })
          .then((cb) => {
            cb.ask(input.text, (err, response) => {
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
    if (this.gunterLimits.has(input.channel.id)) {
      this.gunterLimits.get(input.channel.id).reset();
    }

    return 'it\'s time to gunter again!';
  }

  onMessage(message) {
    if (message.content) {
      // Allow mentions everywhere, but strip them at the back/front
      let match = message.content.match(`^<@!?${this.bot.discord.user.id}> (.+)`) || message.content.match(`(.+) <@!?${this.bot.discord.user.id}>$`);
      if (match) {
        let str = match[1];

        let gunterCounter; // Like a Geiger counter, but less radioactive

        if (message.author.id === '177964289091436544') {
          // Get existing gunter cooldown, otherwise create a new one
          if (this.gunterLimits.has(message.channel.id)) {
            gunterCounter = this.gunterLimits.get(message.channel.id);
          } else {
            gunterCounter = new Cooldown(this.gunterLimit, this.gunterBump);
            this.gunterLimits.set(message.channel.id, gunterCounter);
          }

          if (!gunterCounter.bump()) {
            return;
          }
        }

        // Start the typing
        message.channel.startTyping();

        let input = new Input(message, this.bot, null, new Override(`~markov ${str}`));
        let resultPromise = input.process()
          .then((result) => {
            if (result.text) {
              return result.text;
            }

            // If markov failed, do cleverbot
            return new Input(message, this.bot, null, new Override(`~cb ${str}`))
              .process()
              .then(r => r.text);
          });

        Promise.all([
          resultPromise,
          delay(Math.floor((Math.random() * 200) + 700))
        ])
          .then(([text]) => {
            message.channel.stopTyping();

            // Send successful result to the origin
            if (text) {
              if (gunterCounter) {
                return message.channel.sendMessage(`${message.author.toString()} ${text}`, {disableEveryone: true});
              }

              let embed = embedify(text, embedColor);

              return this.bot.send(message.channel, embed);
            }
          })
          // Catch sending errors
          .catch((err) => {
            // Just in case the error happened before the sending
            message.channel.stopTyping();

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
        mkv.add(message.content);
      }
    }
  }
}

module.exports = ConversationAddon;
