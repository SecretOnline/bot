import Addon, { IAddonConfig } from '../common/Addon';
import Input from '../common/Input';
import Command from '../common/Command';
import TextSendable from '../sendables/TextSendable';
import AddonError from '../errors/AddonError';

import { arrayRandom } from '../util';

export default class Numberwang extends Addon {
  id = 'numberwang';
  name = 'Numberwang!';
  description = 'Numberwang is the maths quiz that simply everyone is talking about';
  version = '9.0.0';

  constructor(bot) {
    super(bot);
  }

  async start() {
    return true;
  }
}
