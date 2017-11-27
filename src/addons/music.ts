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
import Discord, {
  DiscordServer,
} from '../connections/Discord';
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
    this.addCommand(new Command('set-music-channel', this.setMusicChannel, this, { permission: 'ADMIN' }));
    this.addCommand(new Command('request', this.request, this));
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

  async request(input: Input) {
    if (!input.server) {
      throw new CommandRequiresServerError();
    }

    if (!this.checkEnabled(input.server)) {
      throw new AddonError(this, 'music is not allowed on this server');
    }

    // Lots and lots of checks coming up. Why does this have to be so annoying?
    const serverConf = this.getConfig(input.server);

    // Make sure a valid text channel has been set up already
    if (!serverConf.channel) {
      // tslint:disable-next-line:max-line-length
      throw new AddonError(this, 'no request channel has been set. use `~set-music-channel` to use music');
    }

    // Get the GuildMember for this user, so we can get thieir voice channel
    const djsServer = (<DiscordServer>(input.server)).raw;
    const member = djsServer.members.get(input.user.raw.id);
    const vc = member.voiceChannel;

    // Make sure the current text channel is the correct one
    if (!this.checkChannel(input.channel)) {
      throw new AddonError(this, 'you must request music in the correct text channel');
    }

    // Ensure user is actually in voice
    if (!vc) {
      throw new AddonError(this, 'you must be in a voice channel to request music');
    }

    // Get the song (before the bot tries to join voice)
    if (!ytdl.validateLink(input.text)) {
      throw new AddonError(this, `${input.text} is not a valid YouTube URL`);
    }

    const info = await ytdl.getInfo(input.text);

    const song: Song = {
      title: info.title,
      artist: {
        name: info.author.name,
        url: info.author.channel_url,
        thumb: info.author.avatar,
      },
      description: info.description,
      url: info.video_url,
      thumb: info.thumbnail_url,
      getStream: () => ytdl(input.text, { filter: 'audioonly' }),
    };

    // Get or create the MusicState
    let musicState: MusicState;
    if (this.servers.has(input.server.id)) {
      musicState = this.servers.get(input.server.id);

      // Ensure user is in the same channel as bot
      if (musicState.voiceChannelId !== vc.id) {
        throw new AddonError(this, 'the bot is already in another voice channel on this server');
      }
    } else {
      musicState = new MusicState(input.channel, vc);
    }

    // Add to queue
    musicState.add(song);

    // Send info
    return new InfoSendable(`Added *${song.artist.name} - ${song.title}* to the queue`)
      .setTitle(`Added to queue: ${song.title}`)
      .setDescription(song.description)
      .setUrl(song.url)
      .setThumbnail(song.thumb)
      .setAuthorName(song.artist.name)
      .setAuthorUrl(song.artist.url)
      .setAuthorThumbnail(song.artist.thumb);
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

  get voiceChannelId() {
    return this.voiceChannel.id;
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

  leave() {
    this.voiceChannel.leave();
    this.voiceConnection = null;

    this.queue = [];

    if (this.dispatcher) {
      this.dispatcher.end();
    }
    this.dispatcher = null;

    this.emit('finish');
  }

  next() {
    this.currentSong = this.queue.shift();

    // tslint:disable-next-line:max-line-length
    const info = new InfoSendable(`Now playing: ${this.currentSong.artist.name} - ${this.currentSong.title}`)
      .setTitle(this.currentSong.title)
      .setDescription(this.currentSong.description)
      .setUrl(this.currentSong.url)
      .setAuthorName(this.currentSong.artist.name)
      .setAuthorUrl(this.currentSong.artist.url)
      .setAuthorThumbnail(this.currentSong.artist.thumb);

    if (this.currentSong.thumb) {
      info.setThumbnail(this.currentSong.thumb);
    }

    this.textChannel.send(info);

    this.dispatcher = this.voiceConnection
      .playStream(this.currentSong.getStream());

    this.dispatcher.on('end', () => this.onStreamEnd());
  }

  private onStreamEnd() {
    if (this.queue.length === 0) {
      this.leave();
    } else {
      this.next();
    }
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
