import Addon from '../common/Addon';
import Input from '../common/Input';
import Command from '../common/Command';
import CompoundSendable from '../sendables/CompoundSendable';
import InfoSendable from '../sendables/InfoSendable';
import TextSendable from '../sendables/TextSendable';
import AddonError from '../errors/AddonError';


// tslint:disable max-line-length
// TODO: Help
// tslint:enable max-line-length

export default class Search extends Addon {
  name = 'Search';
  id = 'dearch';
  description = 'Allows you to harness the infinite power of the internet';
  version: '9.0.0';

  constructor(bot) {
    super(bot);
  }

  async start() {
    // tslint:disable max-line-length
    // this.addCommand(new Command('name', this.fn, this));
    // tslint:enable max-line-length

    return true;
  }
}
