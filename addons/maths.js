const mathjs = require('mathjs');

const ScriptAddon = require('../bot/ScriptAddon.js');
const {noop} = require('../util');

const mathsHelp = [
  'evaluates mathematical expressions',
  'right now, it doesn\'t include the calculus features of math.js, but it does do the core basic operations',
  'it also does trigonometry, matricies, and complex numbers',
  'in case you did need help for your calc, `(nx)^m => (nmx)^(m-1)`',
  'note: some small errors may occur due to the way computers handle numbers. this is unavoidable',
  'examples:',
  '`~maths 1 + 1`',
  '`~maths sin(pi / 4) ^ 2`',
  '`~maths e ^ (pi * i)'
];

const simplifyHelp = [
  'simplifies an algebraic expression',
  'examples:',
  '`~simplify x^2 + x + 3 + x^2`'
];

const deriveHelp = [
  'finds the derivative of a linear expression, with respect to `x`',
  'at this time, secret_bot does not support integration',
  'examples:',
  '`~derive 2x^2 + 3x + 4`'
];

const convertHelp = [
  'converts between units',
  'some common short-hands exist. Look at the math.js documentation for a list',
  'examples:',
  '`~convert 212 fahrenheit in celsius`',
  '`~convert 88 miles/h to m/s`'
];

class Maths extends ScriptAddon {
  constructor(bot) {
    super(bot, 'maths');

    this.maths = mathjs;
  }

  get description() {
    return 'Performs mathematical operations. Full documentation available at http://mathjs.org';
  }

  init() {
    this.addCommand('maths', this.getMathsResult, mathsHelp);
    this.addCommand('math', this.getMathsResult, mathsHelp);
    this.addCommand('convert', this.getMathsResult, convertHelp);
    this.addCommand('simplify', this.getSimplifyResult, simplifyHelp);
    this.addCommand('derive', this.getDeriveResult, deriveHelp);
  }

  getScope(message) {
    if (message.channel.guild) {
      return this.getConfig(message.channel.guild);
    } else {
      return this.getUser(message.user);
    }
  }

  setScope(message, conf) {
    if (message.channel.guild) {
      return this.setConfig(conf, message.channel.guild);
    } else {
      return this.setUser(conf, message.author);
    }
  }

  getMathsResult(input) {
    return input.process()
      .then((res) => {
        let scope = this.getScope(input.message) || {};
        let result;
        try {
          result = this.maths.eval(res.text, scope);
          if (typeof result !== 'string') {
            result = result.toString();
          }
        } catch (err) {
          result = err.message;
        }

        // Save the scope, but don't care if it fails
        this.setScope(input.message, scope)
          .catch(noop);

        return result;
      });
  }

  getSimplifyResult(input) {
    return input.process()
      .then((res) => {
        let result;
        try {
          result = this.maths.simplify(res.text);
          if (typeof result !== 'string') {
            result = result.toString();
          }
        } catch (err) {
          result = err.message;
        }

        return result;
      });
  }

  getDeriveResult(input) {
    return input.process()
      .then((res) => {
        let result;
        try {
          result = this.maths.derivative(res.text);
          if (typeof result !== 'string') {
            result = result.toString();
          }
        } catch (err) {
          result = err.message;
        }

        return result;
      });
  }
}

module.exports = Maths;
