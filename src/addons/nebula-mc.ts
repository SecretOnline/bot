import Addon from '../common/Addon';
import Input from '../common/Input';
import Command from '../common/Command';
import AddonError from '../errors/AddonError';
import * as r2 from 'r2';
import RichSendable from '../sendables/RichSendable';

const SERVER_IP = '106.69.48.50:55710'

export default class NebulaMc extends Addon {
  name = 'The Nebula Minecraft';
  id = 'nebula-mc';
  description = 'An addon for one particular Minecraft server';
  version: '9.0.1';

  constructor(bot) {
    super(bot);
  }

  async start(conf) {
    // tslint:disable max-line-length
    this.addCommand(new Command('status', this.status, this));
    // tslint:enable max-line-length

    return true;
  }

  async status(input: Input) {
    const response = await r2(`https://api.mcsrvstat.us/2/${SERVER_IP}`).json;

    if (!response.online) {
      return new RichSendable('The Nebula: offline')
        .setTitle('The Nebula')
        .setDescription('**offline**')
        .setColor('#992D22');
    }

    const sendable = new RichSendable(`The Nebula: online. ${response.players.online}/${response.players.max}`)
      .setTitle('The Nebula')
      .setDescription(response.motd.clean.join('\n'))
      .setThumbnail(`https://api.mcsrvstat.us/icon/${SERVER_IP}`)
      .setColor('#1F8B4C');

    sendable
      .addSection('Version', `${response.software ?? 'Vanilla'} ${response.version}`, true)
      .addSection('Players', `${response.players.online}/${response.players.max}`, true);

    if (response.players.list) {
      sendable.addSection('Online', response.players.list.join('\n'));
    }

    return sendable;
  }
}
