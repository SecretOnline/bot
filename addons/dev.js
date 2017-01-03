// This addon only works for Discord at the moment
const Discord = require('discord.js');
const eslint = require('eslint');
const beautifier = require('js-beautify').js_beautify;

const eslintrc = require('eslint-rc/.eslintrc.json');
// const jsbeautifyrc = require('eslint-rc/.jsbeautifyrc.json');

const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');

class Dev extends ScriptAddon {
  constructor(bot) {
    super(bot, 'dev');
  }

  init() {
    this.bot.addCommand('beautify', new Command(this.beautify.bind(this), 'dev'));
  }

  deinit() {
    // Do nothing
  }

  beautify(input) {
    let messageProm;
    let match = input.text.match(/(\d{18})/);
    if (match) {
      messageProm = Promise.resolve(input.message.channel.messages.get(match[1]));
    } else {
      messageProm = input.message.channel
        .fetchMessages({
          limit: 10,
          before: input.message.id
        })
        .then((messages) => {
          return messages.find((m) => {
            return m.content.match(/```js\r?\n([\w\W]*)\r?\n```/);
          });
        });
    }

    return messageProm
      .then((message) => {
        return new Promise((resolve, reject) => {
          if (!message) {
            reject('unable to find message to beautify');
            return;
          }

          match = message.content.match(/```js\n([\w\W]*)\n```/);
          if (match) {
            resolve(`\`\`\`js\n${beautifier(match[1])}\n\`\`\``);
          } else {
            reject('message didn\'t contain a js code block');
            return;
          }
        });
      });
  }
}

module.exports = Dev;
