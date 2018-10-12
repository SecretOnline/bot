import { format } from 'url';

import Addon, { IAddonConfig } from '../common/Addon';
import Input from '../common/Input';
import Command from '../common/Command';
import TextSendable from '../sendables/TextSendable';
import Discord, {
  DiscordServer, DiscordUser,
} from '../connections/Discord';
import SectionedSendable from '../sendables/SectionedSendable';
import AddonError from '../errors/AddonError';
import WrapperError from '../errors/WrapperError';
import { CommandRequiresServerError } from '../errors/CommandError';
import { arrayRandom } from '../util';

interface WololoConfig extends IAddonConfig {
  redRoleId?: string;
  blueRoleId?: string;
}

export default class Wololo extends Addon {
  id = 'wololo';
  name = 'Wololo';
  description = 'Wololo Wololo Wololo Wololo';
  version = '9.0.0';

  private djs: Discord;

  constructor(bot) {
    super(bot);

    this.djs = <Discord>(bot.getConnection('djs'));
  }

  async start() {

    // tslint:disable max-line-length
    this.addCommand(new Command('wololo', this.doWololo, this));
    // tslint:enable max-line-length

    return true;
  }

  async doWololo(input: Input) {
    if (!input.server) {
      throw new CommandRequiresServerError();
    }
    if (input.connection.id !== 'djs') {
      throw new AddonError(this, 'This command only works on Discord');
    }
    const config: WololoConfig = this.getConfig(input.server);

    if (!(config.redRoleId && config.blueRoleId)) {
      throw new AddonError(this, 'This server has not been configured. This is a manual process');
    }

    const server = (input.server as DiscordServer).raw;
    const redRole = server.roles.get(config.redRoleId);
    const blueRole = server.roles.get(config.blueRoleId);
    if (!(redRole && blueRole)) {
      throw new AddonError(this, 'One of the configured roles does not exist');
    }

    const user = (input.user as DiscordUser).raw;
    const member = server.members.get(user.id);

    if (member.roles.has(redRole.id) && member.roles.has(blueRole.id)) {
      const roleToRemove = arrayRandom([redRole, blueRole]);
      await member.removeRole(roleToRemove, 'User had both wololo roles');
      return new TextSendable('You were in both roles, one has been removed');
    }

    const redMembers = server.members.filterArray(m => m.roles.has(redRole.id));
    const blueMembers = server.members.filterArray(m => m.roles.has(blueRole.id));

      // User is in red role, wololo a blue member to red
    if (member.roles.has(redRole.id)) {
      if (!blueMembers.length) {
        return new TextSendable(`Wololo`);
      }

      const switchMember = arrayRandom(blueMembers);
      await switchMember.addRole(redRole, `Wololo-ed by ${member.displayName}`);
      await switchMember.removeRole(blueRole, `Wololo-ed by ${member.displayName}`);
      return new TextSendable(`Wololo ${switchMember.toString()}`);
    }

      // User is in blue role, wololo a red member to blue
    if (member.roles.has(blueRole.id)) {
      if (!redMembers.length) {
        return new TextSendable(`Wololo`);
      }

      const switchMember = arrayRandom(redMembers);
      await switchMember.addRole(blueRole, `Wololo-ed by ${member.displayName}`);
      await switchMember.removeRole(redRole, `Wololo-ed by ${member.displayName}`);
      return new TextSendable(`Wololo ${switchMember.toString()}`);
    }

    // User is in no role, add them to the one with lowest numbers
    let roleToAdd;
    if (redMembers.length === blueMembers.length) {
      roleToAdd = arrayRandom([redRole, blueRole]);
    } else if (redMembers.length > blueMembers.length) {
      roleToAdd = blueRole;
    } else if (redMembers.length < blueMembers.length) {
      roleToAdd = redRole;
    } else {
      throw new AddonError(this, 'There was a really bad logic error. How did this even happen?');
    }

    await member.addRole(roleToAdd);
    return new TextSendable('Wololo');
  }
}
