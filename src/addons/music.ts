import { Readable } from 'stream';
import * as ytdl from 'ytdl-core';

import Addon, { IAddonConfig } from '../common/Addon';
import Input from '../common/Input';
import Bot from '../bot/Bot';
import Message from '../common/Message';
import Command from '../common/Command';
import Server from '../common/Server';
import Channel from '../common/Channel';
import Discord from '../connections/Discord';
import TextSendable from '../sendables/TextSendable';
import AddonError from '../errors/AddonError';
import { CommandRequiresServerError } from '../errors/CommandError';

import { truncate } from '../util';

export default class Music extends Addon {
  id = 'music';
  name = 'Music';
  // tslint:disable-next-line max-line-length
  description = 'Plays music on supported platforms';
  version = '9.0.0';

  private djs: Discord;
  private servers = new Map<string, MusicState>();

  constructor(bot: Bot) {
    super(bot);

    this.djs = <Discord>(bot.getConnection('djs'));
  }

  async start(conf: IAddonConfig) {
    // tslint:disable max-line-length
    this.addCommand(new Command('enable-music', this.enableMusic, this, { permission: 'OVERLORD' }));
    this.addCommand(new Command('disable-music', this.disableMusic, this, { permission: 'ADMIN' }));
    // tslint:enable max-line-length

    // Register handlers

    return true;
  }

  async stop() {
    // Unregister handlers

    return true;
  }

  checkEnabled(server: Server) {
    const conf = this.getConfig(server) || {};
    return !!conf.enabled;
  }

  checkChannel(server: Server) {
    const conf = this.getConfig(server) || {};
    if (!conf.channel) {
      // tslint:disable-next-line max-line-length
      throw new AddonError(this, 'no request channel has been set. use `~set-channel` to use music');
    }
    return true;
  }

  async enableMusic(input: Input) {
    if (!input.server) {
      throw new CommandRequiresServerError();
    }

    if (this.checkEnabled(input.server)) {
      return new TextSendable('this server can already play music');
    }

    const conf = this.getConfig(input.server) || {};
    conf.enabled = true;
    await this.setConfig(input.server, conf);
    return new TextSendable('enabled music on this server');
  }

  async disableMusic(input: Input) {
    if (!input.server) {
      throw new CommandRequiresServerError();
    }

    if (!this.checkEnabled(input.server)) {
      return new TextSendable('music is already disabled on this server');
    }

    const conf = this.getConfig(input.server) || {};
    conf.enabled = false;
    await this.setConfig(input.server, conf);
    return new TextSendable('disabled music on this server');
  }
}

class MusicState {
  constructor(channel: Channel) {

  }
}

class MusicQueue {
  private queue: Song[] = [];

  add(song: Song) {
    this.queue.push(song);
  }

  peek() {
    return this.queue[0];
  }

  pop() {
    return this.queue.shift();
  }
}

interface Song {
  title: string;
  artist: {
    name: string;
    url: string;
    thumb?: string;
  };
  description?: string;
  url: string;
  thumb?: string;
  getStream: () => Readable;
}
