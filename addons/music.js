const ytdl = require('ytdl-core');
const Discord = require('discord.js');
const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');

const {truncate} = require('../util');

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
    this.addCommand('skip', this.justSkip, Command.PermissionLevels.ADMIN);

    this.bot.discord.on('voiceStateUpdate', this.onVoiceState.bind(this));
  }

  checkEnabled(guild) {
    if (!guild) {
      return false;
    }

    let conf = this.getConfig(guild) || {};
    return !!conf.enabled; // Force it to be a boolean
  }

  enableServer(input) {
    if (!input.message.guild) {
      return 'music is only available on servers';
    }

    if (this.checkEnabled(input.message.guild)) {
      return 'music is already enabled on this server';
    }

    let conf = this.getConfig(input.message.guild) || {};
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

    let conf = this.getConfig(input.message.guild) || {};
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

      let vidUrl = obj.queue.pop();
      let stream = ytdl(vidUrl, {audioonly: true});
      let dispatcher = obj.connection.playStream(stream);
      obj.dispatcher = dispatcher;

      let startProm = new Promise((resolve, reject) => {
        dispatcher.once('start', resolve);
      });
      let infoProm = new Promise((resolve, reject) => {
        ytdl.getInfo(vidUrl, (err, res) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(res);
        });
      });

      Promise.all([
        startProm,
        infoProm
      ])
        .then(([start, info]) => {
          let length = Number.parseInt(info.length_seconds);
          let mins = Math.floor(length / 60);
          let seconds = (mins === 0) ? length : length % (mins * 60);
          if (seconds < 10) {
            seconds = `0${seconds}`;
          }

          if (info.author.avatar.match(/^\/\//)) {
            info.author.avatar = `https:${info.author.avatar}`;
          }

          let embed = new Discord.RichEmbed()
            .setTitle(`Now playing: ${truncate(info.title, 80)}`)
            .setURL(vidUrl)
            .setAuthor(info.author.name, info.author.avatar, `https://youtube.com${info.author.ref}`)
            .setDescription(truncate(info.description, 80))
            .setThumbnail(info.thumbnail_url)
            .setColor('#CC181E')
            .addField('Info', [
              `Length: ${mins}:${seconds}`,
              `Views: ${info.view_count}`
            ].join('\n'));

          return this.bot.send(obj.textChannel, embed);
        })
        .catch((err) => {
          this.error(`unable to send playing embed for ${vidUrl}`);
        });

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

    let match = input.text.match(/youtu\.?be(?:\.com)?\/(?:watch\?v=)?([\w-]+)/);
    if (!match) {
      throw 'you must include a YouTube URL in your message';
    }
    let vidUrl = `https://youtube.com/watch?v=${match[1]}`;

    let obj;
    let id = input.message.guild.id;
    if (this.queues.has(id)) {
      obj = this.queues.get(id);

      if (obj.channel && (voiceChannel.id !== obj.channel.id)) {
        throw 'please join the channel that secret_bot is already in';
      }

      obj.textChannel = input.message.channel;
      obj.queue.push(vidUrl);

      return `${vidUrl} has been added to the queue`;
    } else {
      obj = {
        queue: [vidUrl],
        channel: null,
        textChannel: input.message.channel,
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
          return ''; // All going well, an embed will be sent to the server
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

  justSkip(input) {
    let id = input.message.guild.id;
    if (!this.queues.has(id)) {
      throw 'no music is playing right now';
    }
    
    let obj = this.queues.get(id);
    obj.dispatcher.end();
  }

  onVoiceState(oldMember, newMember) {
    if (oldMember.voiceChannel && (!newMember.voiceChannel)) {
      let id = newMember.guild.id;
      if (!this.queues.has(id)) {
        return; // No need to do anything if nothing is playing
      }

      let obj = this.queues.get(newMember.guild.id);
      let index = obj.skipUsers.indexOf(newMember.id);
      if (index > -1) {
        obj.skipUsers.splice(index, 1);
      }

      if (oldMember.voiceChannel.members.size === 0) {
        obj.queue = [];
        obj.dispatcher.end();
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
