import {
  readdir ,
  writeFile,
} from 'fs';
import { join as joinPath } from 'path';

import IObjectMap from '../interfaces/IObjectMap';
import ISendable from '../interfaces/ISendable';
import IIdFilter from '../interfaces/IIdFilter';
import IColorMap from '../interfaces/IColorMap';
import ITargetable from '../interfaces/ITargetable';

import Connection, { IConnectionConfig } from '../common/Connection';
import Addon, { IAddonConfig } from '../common/Addon';
import Server, { IServerConfig } from '../common/Server';
import Channel from '../common/Channel';
import JSONAddon from '../common/JSONAddon';
import Command, { hasPermission } from '../common/Command';
import Message from '../common/Message';
import Input from '../common/Input';

import TextSendable from '../sendables/TextSendable';
import CompoundSendable from '../sendables/CompoundSendable';
import ErrorSendable from '../sendables/ErrorSendable';

import {
  CommandNotFoundError,
  CommandNotEnabledError,
  CommandMultipleAddonsError,
} from '../errors/CommandError';

import { regexEscape } from '../util';

/**
 * Configuration structure for the bot
 *
 * @interface BotConfig
 */
interface BotConfig {
  /**
   * Configuration for the bot's connections
   *
   * @type {IObjectMap<IConnectionConfig>}
   * @memberof BotConfig
   */
  connections: IObjectMap<IConnectionConfig>;
  /**
   * Server-agnostic configuration for addons
   *
   * @type {IObjectMap<IAddonConfig>}
   * @memberof BotConfig
   */
  addons: IObjectMap<IAddonConfig>;
  /**
   * Paths used by the bot
   *
   * @type {IObjectMap<string>}
   * @memberof BotConfig
   */
  paths: IObjectMap<string>;
  /**
   * Addon IDs that are always active
   *
   * @type {string[]}
   * @memberof BotConfig
   */
  always: string[];
  /**
   * Filter for servers
   *
   * @type {IIdFilter}
   * @memberof BotConfig
   */
  filter: IIdFilter;
  defaults: {
    /**
     * Default server configuration
     *
     * @type {IServerConfig}
     */
    server: IServerConfig;
    /**
     * Default colour settings
     *
     * @type {IColorMap}
     */
    color: IColorMap;
  };
}

export default class Bot {
  private config: BotConfig;
  private connections = new Map<string, Connection>();
  private addons = new Map<string, Addon>();
  private serverConfigs = new Map<string, IServerConfig>();
  private commands = new Map<string, Command[]>();

  async start(config: BotConfig) {
    this.config = config;

    const serverConfFiles = await this.listDirectory(joinPath(
      '.',
      this.config.paths.conf,
    ));
    const serverConfs = this.createServerConfigs(
      serverConfFiles
        .map(p => joinPath('../..', this.config.paths.conf, p)),
    );
    console.log(`loaded ${serverConfs.length} servers`);

    const connectionFiles = await this.listDirectory(joinPath(
      '.',
      this.config.paths.connections,
    ));
    const connections = await this.createConnections(
      connectionFiles
        .map(p => joinPath('../..', this.config.paths.connections, p)),
    );
    const connectionProm = this.initConnections(connections)
      .then(() => console.log(`loaded ${this.connections.size} connections`));

    const addonFiles = await this.listDirectory(joinPath(
      '.',
      this.config.paths.addons,
    ));
    const addons = await this.createAddons(
      addonFiles
        .map(p => joinPath('../..', this.config.paths.addons, p)),
    );
    // Finish loading connections before initializaing addons
    const addonProm = connectionProm
      .then(() => this.initAddons(addons))
      .then(() => console.log(`loaded ${this.addons.size} addons`));

    return await Promise.all([
      connectionProm,
      addonProm,
    ]);
  }

  addCommand(command: Command) {
    if (!this.commands.has(command.name)) {
      this.commands.set(command.name, []);
    }

    const commArr = this.commands.get(command.name);

    if (commArr.find(c => c.id === command.id)) {
      return false;
    }

    commArr.push(command);
    return true;
  }

  removeCommand(command: Command) {
    if (!this.commands.has(command.name)) {
      return true;
    }

    const commArr = this.commands.get(command.name);

    const index = commArr.findIndex(c => c.id === command.id);
    if (index !== undefined) {
      commArr.splice(index, 1);
    }

    if (commArr.length === 0) {
      this.commands.delete(command.name);
    }

    return true;
  }

  getCommand(trigger: string, message: Message): Command {
    if (trigger === '') {
      return null;
    }

    let serverConf: IServerConfig;
    if (message.server) {
      serverConf = this.getServerConfig(message.server);
    } else {
      serverConf = this.config.defaults.server;
    }
    const prefix = serverConf.prefix;

    // Check if this is a command
    const match = trigger.match(new RegExp(`^${regexEscape(prefix)}(.+)`));
    if (!match) {
      return null;
    }
    const name = match[1];

    const commandArr = this.commands.get(name);
    if (!commandArr) {
      throw new CommandNotFoundError(prefix, name);
    }

    const allowedAddons = this.getAllowedAddons(message.server);
    const allowedCommands = commandArr.filter(c => allowedAddons.indexOf(c.addon.id) > -1);

    if (allowedCommands.length === 0) {

      if (hasPermission(message.user, 'ADMIN', message.channel)) {
        const addonNameMap = commandArr.map(c => c.addon.id);

        throw new CommandNotEnabledError(prefix, name, addonNameMap);
      }

      throw new CommandNotFoundError(prefix, name);
    } else if (allowedCommands.length === 1) {
      return allowedCommands[0];
    } else {
      throw new CommandMultipleAddonsError(prefix, name, allowedAddons);
    }
  }

  getConnectionConfig(conn: Connection) {
    return this.config.connections[conn.id];
  }

  getAddonConfig(addon: Addon, context?: Server) {
    if (context) {
      const serverconf = this.getServerConfig(context);
      return serverconf['addon-conf'][addon.id];
    }

    return this.config.addons[addon.id];
  }

  getAllowedAddons(server: Server) {
    let res: string[] = this.config.always.slice();

    if (server) {
      const serverConf = this.getServerConfig(server);

      res = res.concat(serverConf.addons);
    } else {
      res = res.concat(this.config.defaults.server.addons);
    }

    return res;
  }

  getServerConfig(server: Server) {
    if (!this.serverConfigs.has(server.id)) {
      this.serverConfigs.set(server.id, this.newServerConfig(server));
      this.writeServerConfig(server);
    }

    return this.serverConfigs.get(server.id);
  }

  getColorMap(target: ITargetable | Server) {
    if (target instanceof Server) {
      const serverConf = this.getServerConfig(target);

      return serverConf.color || this.config.defaults.color;
    } else if (target instanceof Channel) {
      const serverConf = this.getServerConfig(target.server);

      return serverConf.color || this.config.defaults.color;
    } else {
      return this.config.defaults.color;
    }
  }

  async process(input: Input): Promise<ISendable> {
    let quickReturn = true;
    let output = '';

    const words = input.args;

    for (let i = 0; i < words.length; i += 1) {
      let command: Command;

      try {
        command = this.getCommand(words[i], input.message);
      } catch (error) {
        return new ErrorSendable(error);
      }

      if (command) {
        // Stop the immediate resolving
        quickReturn = false;

        let newStr = '';
        if (words.length !== 1) {
          newStr = words.splice(i + 1).join(' ');
        }

        // Process text for next command
        const result = await this.process(input.from(new TextSendable(newStr)));

        if (result instanceof ErrorSendable) {
          return result;
        }

        // Run this command
        const newInput = input.from(result);
        const sendable = await command.run(newInput);

        if (!(result instanceof TextSendable)) {
          // Keep extras from pre-processing, but force text value
          if (sendable instanceof CompoundSendable) {
            return sendable.from(result);
          }
          return new CompoundSendable(sendable.text, [sendable, result], sendable.private);
        }

        return sendable;
      } else {
        // Append word to output, and go to next word
        output = `${output ? `${output} ` : ''}${words[i]}`;
      }
    }

    // No commands found, just return
    return new TextSendable(output);
  }

  private async onMessage(msg: Message) {
    const server = msg.server;
    const channel = msg.channel;

    let serverConfig: IServerConfig;
    if (server) {
      // Check connection's server filter
      if (this.config.filter) {
        const filter = this.config.filter;

        // If server ID not in whitelist, stop
        if (filter.whitelist) {
          if (!(filter.whitelist.indexOf(server.id) > -1)) {
            return;
          }
        }

        // If server ID in blacklist, stop
        if (filter.blacklist) {
          if (filter.blacklist.indexOf(server.id) > -1) {
            return;
          }
        }
      }

      // Server is allowed, get config
      serverConfig = this.getServerConfig(server);

      // Check server's channel filter
      if (serverConfig.filter) {
        const filter = serverConfig.filter;

        // If channel ID not in whitelist, stop
        if (filter.whitelist) {
          if (!(filter.whitelist.indexOf(channel.id) > -1)) {
            return;
          }
        }

        // If channel ID in blacklist, stop
        if (filter.blacklist) {
          if (filter.blacklist.indexOf(channel.id) > -1) {
            return;
          }
        }
      }
    } else {
      serverConfig = this.config.defaults.server;
    }

    console.log(`${msg.user.name}: ${msg.text}`);

    // Send message to all addons that want it

    // Filter out bots
    if (msg.user.isBot) {
      return;
    }

    // Safeguard against strikethrough triggering commands
    if (serverConfig.prefix === '~' && msg.text.match('^~~')) {
      return;
    }

    // Messages should start with a command
    if (!msg.text.match(new RegExp(`^${regexEscape(serverConfig.prefix)}`))) {
      return;
    }

    // Process it!
    const result = await this.process(new Input(msg));

    // Reply with result
    let target;
    if (result instanceof ErrorSendable) {
      target = msg.user;
    } else  {
      target = msg.channel;
    }

    const replyMsg = await msg.connection.send(target, result);
    // Message sent. Anything else?
    // Message editing will need to be added soon
  }

  private listDirectory(path: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      readdir(path, (err, data) => {
        if (err) {
          // this.error(`unable to read directory ${path}`);
          reject(err);
          return;
        }

        resolve(data);
      });
    });
  }

  private createConnections(files: string[]) {
    const connections: Connection[] = files
      .map((file) => {
        if (file.match(/\.js$/)) {
          let connClass;

          try {
            connClass = require(file).default;
          } catch (err) {
            // this.error(`unable to find connection ${file}`);
            // this.error(err);
            return null;
          }

          try {
            const conn: Connection = new connClass(this);

            if (this.connections.has(conn.id)) {
              // this.error(`connection ${conn.id} has alrady been created`);
              return null;
            }

            this.connections.set(conn.id, conn);

            return conn;
          } catch (err) {
            // this.error(`unable to create connection ${file}`);
            // this.error(err);
            return null;
          }

        } else {
          return null;
        }
      })
      .filter((a: Connection) => a);

    return connections;
  }

  private initConnections(connections: Connection[]) {
    return Promise.all(
      connections
        .map((conn) => {
          return conn
            .start(this.getConnectionConfig(conn))
            .then(
              (result) => {
                // Add message listener for connection
                conn.on('message', m => this.onMessage(m));
                return result;
              },
              (err): boolean => {
                // this.error(`unable to start connection ${conn.name}`);
                // this.error(err);
                return false;
              },
          );
        }),
    );
  }

  private createAddons(files: string[]) {
    const addons: Addon[] = files
      .map((file) => {
        let addon: Addon;

        if (file.match(/\.js$/)) {
          let addonClass;

          try {
            addonClass = require(file).default;
          } catch (err) {
            // this.error(`unable to find addon ${file}`);
            // this.error(err);
            return null;
          }

          try {
            addon = new addonClass(this);
          } catch (err) {
            // this.error(`unable to create addon ${file}`);
            // this.error(err);
            return null;
          }

        } else if (file.match(/\.json$/)) {
          const addonData: IObjectMap<string> = require(file);

          addon = new JSONAddon(this, file, addonData);
        } else {
          return null;
        }

        if (this.addons.has(addon.id)) {
          // this.error(`addon ${addon.id} has already been created`);
          return null;
        }

        this.addons.set(addon.id, addon);

        return addon;
      })
      .filter((a: Addon) => a);

    return addons;
  }

  private initAddons(addons: Addon[]) {
    return Promise.all(
      addons
        .map((addon) => {
          return addon
            .start(this.getAddonConfig(addon))
            .then((result) => {
              // ???
              // Does anything need to be done? Addons don't really need handlers attached
              return result;
            },    (err): boolean => {
              // this.error(`unable to start addonection ${addon.name}`);
              // this.error(err);
              return false;
            });
        }),
    );
  }

  private createServerConfigs(files: string[]) {
    const configs: IServerConfig[] = files
      .map((file) => {
        let conf: IServerConfig;

        if (file.match(/\.json$/)) {
          conf = require(file);
        } else {
          return null;
        }

        const serverId = file.match(/^(?:.*[\\/])([^\\/]*).conf.json$/)[1];

        if (this.serverConfigs.has(serverId)) {
          // this.error(`config for ${serverId} has already been created`);
          return null;
        }

        this.serverConfigs.set(serverId, conf);

        return conf;
      })
      .filter(c => c);

    return configs;
  }

  private newServerConfig(server: Server): IServerConfig {
    return {
      name: server.name,
      prefix: this.config.defaults.server.prefix,
      addons: this.config.defaults.server.addons.slice(),
      'addon-conf': {},
    };
  }

  private writeServerConfig(server: Server) {
    const conf = this.getServerConfig(server);
    writeFile(
      joinPath(
        this.config.paths.conf,
        `${server.connection.id}-${server.id}.conf.json`,
      ),
      JSON.stringify(conf, null, 2),
      (err) => {
        if (err) {
          console.error(`unable to write ${server.id}.conf.json`);
          return;
        }
      });
  }
}
