import { format } from 'url';
import * as r2 from 'r2';

import Addon, { IAddonConfig } from '../common/Addon';
import Input from '../common/Input';
import Command from '../common/Command';
import TextSendable from '../sendables/TextSendable';
import SectionedSendable from '../sendables/SectionedSendable';
import AddonError from '../errors/AddonError';
import WrapperError from '../errors/WrapperError';

export default class RandomStuff extends Addon {
  id = 'randomstuff';
  name = 'Random Stuff';
  description = 'Either things that are random, or things that use random';
  version = '9.0.0';

  constructor(bot) {
    super(bot);
  }

  async start() {
    // tslint:disable max-line-length
    // tslint:enable max-line-length

    return true;
  }
}
