const mathjs = require('mathjs');

const ScriptAddon = require('../bot/ScriptAddon.js');

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

    this.maths = mathjs.parser();
  }

  get description() {
    return 'Performs mathematical operations. Full documentation available at http://mathjs.org';
  }

  init() {
    this.addCommand('maths', this.getMathsResult, mathsHelp);
    this.addCommand('math', this.getMathsResult, mathsHelp);
    this.addCommand('convert', this.getMathsResult, convertHelp);
  }

  getMathsResult(input) {
    return input.process()
      .then((res) => {
        let result;
        try {
          result = this.maths.eval();
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
