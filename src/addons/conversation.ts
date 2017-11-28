import Addon from '../common/Addon';
import Input from '../common/Input';
import Command from '../common/Command';
import TextSendable from '../sendables/TextSendable';
import AddonError from '../errors/AddonError';
import { arrayRandom } from '../util';

import Markov from '../bot/Markov';

// tslint:disable max-line-length
const markovHelp = [
  'syntax: `~<markov> <sentence>`',
  'the `enable/disable-addon` commands allow you to add and remove command groups from your server',
].join('\n');
// tslint:enable max-line-length

export default class Conversation extends Addon {
  name = 'Conversation';
  id = 'conversation';
  description = 'Allows you to talk with the bot. Good luck understanding it';
  version: '9.0.0';

  constructor(bot) {
    super(bot);
  }

  async start() {
    // tslint:disable max-line-length
    this.addCommand(new Command('markov', this.markov, this, { help: markovHelp }));
    // tslint:enable max-line-length

    return true;
  }

  async markov(input: Input) {

  }


}
