import { Readable } from 'stream';
import { EventEmitter } from 'events';
import * as ytdl from 'ytdl-core';
import {
  VoiceChannel,
  VoiceConnection,
  StreamDispatcher,
} from 'discord.js';

import Addon, { IAddonConfig } from '../common/Addon';
import Input from '../common/Input';
import Bot from '../bot/Bot';
import Message from '../common/Message';
import Command from '../common/Command';
import Server from '../common/Server';
import Channel from '../common/Channel';
import Discord from '../connections/Discord';
import TextSendable from '../sendables/TextSendable';
import InfoSendable from '../sendables/InfoSendable';
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

  checkChannel(channel: Channel) {
    const conf = this.getConfig(channel.server) || {};
    if (!conf.channel) {
      return false;
    }
    if (conf.channel !== channel.id) {
      return false;
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
    conf.textChannel = input.channel.id;

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

  async setMusicChannel(input: Input) {
    if (!input.server) {
      throw new CommandRequiresServerError();
    }

    if (!this.checkEnabled(input.server)) {
      throw new AddonError(this, 'music is not allowed on this server');
    }

    const serverConf = this.getConfig(input.server);
    serverConf.channel = input.channel.id;
    await this.setConfig(input.server, serverConf);

    return new TextSendable('set this channel for music requests');
  }
}

class MusicState extends EventEmitter {
  private currentSong: Song = null;
  private textChannel: Channel;
  private voiceChannel: VoiceChannel;
  private voiceConnection: VoiceConnection;
  private dispatcher: StreamDispatcher = null;

  private queue: Song[] = [];

  constructor(textChannel: Channel, voiceChannel: VoiceChannel) {
    super();

    this.textChannel = textChannel;
    this.voiceChannel = voiceChannel;

    this.voiceChannel.join()
      .then((vc) => {
        this.voiceConnection = vc;

        if (this.queue.length) {
          this.next();
        } else {
          this.onStreamEnd();
          return;
        }
      });
  }

  add(song: Song) {
    this.queue.push(song);
  }

  peek() {
    return this.queue[0];
  }

  skip() {
    if (this.dispatcher) {
      this.dispatcher.end();
    }
  }

  next() {
    this.currentSong = this.queue.shift();

    // tslint:disable-next-line:max-line-length
    const info = new InfoSendable(`Now playing: ${this.currentSong.artist.name} - ${this.currentSong.thumb}`)
      .setTitle(`Now playing: ${this.currentSong.artist.name} - ${this.currentSong.thumb}`)
      .setDescription(this.currentSong.description)
      .setUrl(this.currentSong.url);

    if (this.currentSong.thumb) {
      info.setThumbnail(this.currentSong.thumb);
    }

    this.textChannel.send(info);

    this.dispatcher = this.voiceConnection
      .playStream(this.currentSong.getStream());
  }

  private onStreamEnd() {
    if (this.queue.length === 0) {
      this.voiceChannel.leave();
      this.voiceConnection = null;

      if (this.dispatcher) {
        this.dispatcher.end();
      }
      this.dispatcher = null;

      this.emit('finish');
      return;
    }

    this.next();
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
