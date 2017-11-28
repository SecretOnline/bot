import Addon from '../common/Addon';
import Input from '../common/Input';
import Channel from '../common/Channel';
import Message from '../common/Message';
import Command from '../common/Command';
import TextSendable from '../sendables/TextSendable';
import AddonError from '../errors/AddonError';
import { arrayRandom, delay } from '../util';

import { filterByChannel } from '../bot/Logger';
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

  private channels = new Map<string, Markov>();

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
    const markov = await this.readyMarkov(input.channel);

    return new TextSendable(markov.respond(input.text));
  }

  async readyMarkov(channel: Channel) {
    if (this.channels.has(channel.id)) {
      return this.channels.get(channel.id);
    }

    const markov = new Markov();

    // Get latest message from the logs, and add them
    const lines = await this.bot.getLogs(filterByChannel(channel));
    lines.forEach(l => markov.add(l.message));

    this.channels.set(channel.id, markov);
    return markov;
  }

  async onMessage(message: Message) {
    if (!message.text) {
      return;
    }

    const botDiscordId = '177875572880310273';

    // Strip mentions from ends of message
    const match =
      message.text.match(`^<@!?${botDiscordId}> (.+)`) ||
      message.text.match(`(.+) <@!?${botDiscordId}>$`);

    if (match) {
      const str = match[1];

      // Start the typing (Discord only)
      if (message.channel.connection.id === 'djs') {
        message.channel.raw.startTyping();
      }

      const input = new Input(message, `~markov ${str}`);

      const resultProm = await this.bot.process(input);

      try {
        const [sendable] = await Promise.all([
          resultProm,
          delay(Math.floor((Math.random() * 200) + 700)),
        ]);

        // Send successful result to the origin
        if (sendable) {
          message.channel.send(sendable);
        }

        if (message.channel.connection.id === 'djs') {
          message.channel.raw.startTyping();
        }
      } catch (err) {
        // Stop typing (Discord only)
        if (message.channel.connection.id === 'djs') {
          message.channel.raw.stopTyping();
        }
      }
    }

    if (message.user.isBot) {
      return;
    }

    const id = message.channel.id;
    if (this.channels.has(id)) {
      const mkv = this.channels.get(id);
      mkv.add(message.text);
    }
  }
}
