// This addon only works for Discord at the moment
const linter = require('eslint').linter;
const beautifier = require('js-beautify').js_beautify;

const eslintrc = require('eslint-rc/.eslintrc.json');
const jsbeautifyrc = require('eslint-rc/.jsbeautifyrc.json');

const ScriptAddon = require('../bot/ScriptAddon.js');

let beautifyHelp = [
  'beautifies a JavaScript code block',
  'if given a message ID, `~beautify` will use that message',
  'otherwise, it scans the past 10 messages in the channel',
  'the jsbeautifyrc file can be found at https://github.com/SecretOnline/eslint-rc/blob/master/.jsbeautifyrc.json'
];
let eslintHelp = [
  'lints a JavaScript code block using eslint',
  'if given a message ID, `~eslint` will use that message',
  'otherwise, it scans the past 10 messages in the channel',
  'the eslintrc file can be found at https://github.com/SecretOnline/eslint-rc/blob/master/.eslintrc.json'
];

class Dev extends ScriptAddon {
  constructor(bot) {
    super(bot, 'dev');
  }

  init() {
    this.addCommand('beautify', this.beautify, beautifyHelp);
    this.addCommand('eslint', this.eslint, eslintHelp);
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
            resolve(`\`\`\`js\n${beautifier(match[1], jsbeautifyrc)}\n\`\`\``);
          } else {
            reject('message didn\'t contain a js code block');
            return;
          }
        });
      });
  }

  eslint(input) {
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
            let messages = linter.verify(match[1], eslintrc, {
              filename: 'message.js'
            });
            let lines = messages
              .map((m) => {
                return `${m.line}:${m.column} ${m.severity === 2 ? 'error' : 'warning'} ${m.message} ${m.ruleId}`;
              })
              .join('\n');
            resolve(`\`\`\`\n${lines}\n\`\`\``);
          } else {
            reject('message didn\'t contain a js code block');
            return;
          }
        });
      });
  }
}

module.exports = Dev;
