import * as mathjs from 'mathjs';

import Addon, { IAddonConfig } from '../common/Addon';
import Input from '../common/Input';
import Message from '../common/Message';
import Command from '../common/Command';
import TextSendable from '../sendables/TextSendable';
import AddonError from '../errors/AddonError';

import { noop } from '../util';

// tslint:disable max-line-length
const mathsHelp = [
  'evaluates mathematical expressions',
  'as well as being able to use the basic operators, functions are made availalbe',
  'a full list of functions can be [found here](http://mathjs.org/docs/reference/functions.html#algebra-functions) down',
  'note: some small errors may occur due to the way computers handle numbers. this is unavoidable',
  'examples:',
  '`~maths 1 + 1`',
  '`~maths sin(pi / 4) ^ 2`',
  '`~maths e ^ (pi * i)',
  '`~maths combinations(10, 5)`',
  '`~maths mean(1, 2, 3, 4, 5, 6, 7, 8, 9, 0)`',
].join('\n');

const simplifyHelp = [
  'simplifies an algebraic expression',
  'examples:',
  '`~simplify x^2 + x + 3 + x^2`',
].join('\n');

const deriveHelp = [
  'finds the derivative of a linear expression, with respect to `x`',
  'at this time, secret_bot does not support integration',
  'examples:',
  '`~derive 2x^2 + 3x + 4`',
].join('\n');

const convertHelp = [
  'converts between units',
  'some common short-hands exist. Look at the math.js documentation for a list',
  'examples:',
  '`~convert 212 fahrenheit in celsius`',
  '`~convert 88 miles/h to m/s`',
].join('\n');
// tslint:enable max-line-length

export default class Maths extends Addon {
  id = 'maths';
  name = 'Maths';
  // tslint:disable-next-line max-line-length
  description = 'Performs mathematical operations. Full documentation available at http://mathjs.org';
  version = '9.0.0';

  private maths = mathjs;

  constructor(bot) {
    super(bot);
  }

  async start() {
    // tslint:disable max-line-length
    this.addCommand(new Command('maths', this.getMathsResult, this, { help: mathsHelp }));
    this.addCommand(new Command('math', this.getMathsResult, this, { help: mathsHelp }));
    this.addCommand(new Command('convert', this.getMathsResult, this, { help: convertHelp }));
    this.addCommand(new Command('simplify', this.getSimplifyResult, this, { help: simplifyHelp }));
    this.addCommand(new Command('derive', this.getDeriveResult, this, { help: deriveHelp }));
    // tslint:enable max-line-length

    return true;
  }

  getScope(message: Message) {
    return this.getConfig(message.server || message.user);
  }

  setScope(message: Message, conf: IAddonConfig) {
    return this.setConfig(message.server || message.user, conf);
  }

  async getMathsResult(input: Input) {
    const scope = this.getScope(input.message) || {};
    let result;
    try {
      result = this.maths.eval(input.text, scope);
      if (typeof result !== 'string') {
        result = result.toString();
      }
    } catch (err) {
      throw new AddonError(this, err.message);
    }

    // Save the scope, but don't care if it fails
    this.setScope(input.message, scope)
      .catch(noop);

    return new TextSendable(result);
  }

  async getSimplifyResult(input: Input) {
    let result;
    try {
      result = this.maths.simplify(input.text);
      if (typeof result !== 'string') {
        result = result.toString();
      }
    } catch (err) {
      throw new AddonError(this, err.message);
    }

    return new TextSendable(result);
  }

  async getDeriveResult(input: Input) {
    let result;
    try {
      result = this.maths.derivative(input.text, 'x');
      if (typeof result !== 'string') {
        result = result.toString();
      }
    } catch (err) {
      throw new AddonError(this, err.message);
    }

    return new TextSendable(result);
  }
}
