import Addon from '../common/Addon';
import Input from '../common/Input';
import Command from '../common/Command';
import AddonError from '../errors/AddonError';
import * as r2 from 'r2';
import RichSendable from '../sendables/RichSendable';

export default class Scoran extends Addon {
  name = 'Scoran';
  id = 'scoran';
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
    const response = await r2('https://api.mcsrvstat.us/1/scoran.secretonline.co').json;

    if (response.offline) {
      return new RichSendable('Scoran: offline')
        .setTitle('Scoran')
        .setDescription('**offline**')
        .setColor('#992D22');
    }

    const sendable = new RichSendable(`Scoran: online. ${response.players.online}/${response.players.max}`)
      .setTitle('Scoran')
      .setDescription(response.motd.clean.join('\n'))
      // .setThumbnail(response.icon) // Discord does not support data URIs in images
      .setThumbnail('https://i.imgur.com/KHna8Fv.png')
      .setColor('#1F8B4C');

    sendable
      .addSection('Version', `${response.software} ${response.version}`, true)
      .addSection('Players', `${response.players.online}/${response.players.max}`, true);

    if (response.players.list) {
      sendable.addSection('Online', response.players.list.join('\n'));
    }

    return sendable;
  }
}
