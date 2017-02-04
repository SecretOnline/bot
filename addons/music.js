const ytdl = require('ytdl-core');
const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');

class Music extends ScriptAddon {
  constructor(bot) {
    super(bot, 'music');

    this.queues = new Map();
  }

  init() {
    this.addCommand('enable-music', this.enableServer, Command.PermissionLevels.OVERLORD);
    this.addCommand('disable-music', this.disableServer, Command.PermissionLevels.ADMIN);
    this.addCommand('request', this.requestSong);
    this.addCommand('vote-skip', this.voteSkip);

    this.bot.discord.on('voiceStateUpdate', this.onVoiceState.bind(this));
  }

  checkEnabled(guild) {
    if (!guild) {
      return false;
    }

    let conf = this.getConfig(guild);
    return !!conf.enabled; // Force it to be a boolean
  }

  enableServer(input) {
    if (!input.message.guild) {
      return 'music is only available on servers';
    }

    if (this.checkEnabled(input.message.guild)) {
      return 'music is already enabled on this server';
    }

    let conf = this.getConfig(input.message.guild);
    conf.enabled = true;
    this.setConfig(conf, input.message.guild);
    return 'music has been enabled on this server';
  }

  disableServer(input) {
    if (!input.message.guild) {
      return 'music is only available on servers';
    }
    
    if (!this.checkEnabled(input.message.guild)) {
      return 'music is already disabled on this server';
    }

    let conf = this.getConfig(input.message.guild);
    conf.enabled = false;
    this.setConfig(conf, input.message.guild);
    return 'music has been disabled on this server';
  }

  advanceQueue(id) {
    return new Promise((resolve, reject) => {
      let obj = this.queues.get(id);
      if (obj.dispatcher) {
        obj.dispatcher.end();
      }

      if (obj.queue.length === 0) {
        obj.dispatcher.end();
        obj.connection.disconnect();
        this.queues.delete(id);
        resolve();
        return;
      }

      let stream = ytdl(obj.queue.pop(), {audioonly: true});
      let dispatcher = obj.connection.playStream(stream);
      obj.dispatcher = dispatcher;
      dispatcher.on('end', () => {
        this.advanceQueue(id);
      });
      
      resolve(dispatcher);
    });
  }

  requestSong(input) {
    if (!this.checkEnabled(input.message.guild)) {
      throw 'music is not enabled on this server';
    }

    let voiceChannel = input.message.member.voiceChannel;
    if (!voiceChannel) {
      throw 'please join a voice channel before trying this command';
    }

    let match = input.text.match(/youtu\.?be(?:\.com)\/(?:watch\?v=)([\w-]+)/);
    if (!match) {
      throw 'you must include a YouTube URL in your message';
    }
    let url = `https://youtube.com/watch?v=${match[1]}`;

    let obj;
    let id = input.message.guild.id;
    if (this.queues.has(id)) {
      obj = this.queues.get(id);

      if (obj.channel && (voiceChannel.id !== obj.channel.id)) {
        throw 'please join the channel that secret_bot is already in';
      }

      obj.queue.push(url);
    } else {
      obj = {
        queue: [url],
        channel: null,
        stream: null,
        connection: null,
        dispatcher: null,
        skipUsers: []
      };
      this.queues.set(id, obj);
      
      return voiceChannel.join()
        .then((conn) => {
          obj.connection = conn;
          obj.channel = voiceChannel;
        })
        .then(() => {
          return this.advanceQueue(id);
        })
        .then(() => {
          return `added ${url} to the queue`;
        });
    }
  }

  checkSkip(id) {
    return new Promise((resolve, reject) => {
      if (!this.queues.has(id)) {
        reject('no music playing');
        return;
      }

      let obj = this.queues.get(id);
      let criticalMass = Math.ceil((obj.channel.members.size - 1) / 2);

      if (obj.skipUsers.length >= criticalMass) {
        obj.dispatcher.end();
        resolve('skip successful');
        return;
      } else {
        reject('not enough users for skip');
        return;
      }
    });
  }

  voteSkip(input) {
    let id = input.message.guild.id;
    if (!this.queues.has(id)) {
      throw 'no music is playing right now';
    }
    
    let obj = this.queues.get(id);
    if (obj.skipUsers.includes(input.user.id)) {
      throw 'you have already voted to skip this song';
    }

    obj.skipUsers.push(input.user.id);

    return this.checkSkip(id)
      .then(() => {
        obj.skipUsers = [];
        return 'Skipping to the next song';
      }, () => {
        return 'vote registered';
      });
  }

  onVoiceState(oldMember, newMember) {
    if ((!oldMember.voiceChannel) && newMember.voiceChannel) {
      let id = newMember.guild.id;
      if (!this.queues.has(id)) {
        return; // No need to do anything if nothing is playing
      }

      let obj = this.queues.get(newMember.guild.id);
      let index = obj.skipUsers.indexOf(newMember.id);
      if (index > -1) {
        obj.skipUsers.splice(index, 1);
      }

      this.checkSkip(newMember.guild.id)
        .then(() => {
          obj.skipUsers = [];
          obj.dispatcher.end();
        }, () => {
          // Do nothing, no skip needs to happen
        });
    }
  }
}

module.exports = Music;
