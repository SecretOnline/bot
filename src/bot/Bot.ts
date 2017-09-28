import {
  readdir ,
  writeFile,
} from 'fs';
import { join as joinPath } from 'path';

import IObjectMap from '../interfaces/IObjectMap';
import ISendable from '../interfaces/ISendable';

import Connection, { IConnectionConfig } from '../common/Connection';
import Addon, { IAddonConfig } from '../common/Addon';
import Server, { IServerConfig } from '../common/Server';
import JSONAddon from '../common/JSONAddon';
import Command from '../common/Command';
import Message from '../common/Message';
import Input from '../common/Input';

import TextSendable from '../sendables/TextSendable';
import CompoundSendable from '../sendables/CompoundSendable';

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
  defaults: {
    /**
     * Default server configuration
     *
     * @type {IServerConfig}
     */
    server: IServerConfig;
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

    const connectionFiles = await this.listDirectory(joinPath(
      '.',
      this.config.paths.connections,
    ));
    const connections = await this.createConnections(
      connectionFiles
        .map(p => joinPath('../..', this.config.paths.connections, p)),
    );
    return await this.initConnections(connections);
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

    // Check if this is a command
    const match = trigger.match(new RegExp(`^${regexEscape(serverConf.prefix)}(.+)`));
    if (!match) {
      return null;
    }

    const commandArr = this.commands.get(match[1]);
    if (!commandArr) {
      // TODO: throw error not string
      throw `\`${serverConf.prefix}${match[1]}\` is not a valid command`;
    }

    const allowedAddons = this.getAllowedAddons(message.server);
    const allowedCommands = commandArr.filter(c => allowedAddons.indexOf(c.addon.id) > -1);

    if (allowedCommands.length === 0) {
      // TODO: throw error not string
      throw `\`${serverConf.prefix}${match[1]}\` is not a valid command`;
    } else if (allowedCommands.length === 1) {
      return allowedCommands[0];
    } else {
      const allowedGroups = allowedCommands
        .map(c => `\`${c.addon.id}\``)
        .join(' ');

      // TODO: throw error not string
      // tslint:disable-next-line max-line-length
      throw `\`${serverConf.prefix}${match[1]}\` is added by multiple addons (${allowedGroups}). use \`${serverConf.prefix}<group>.${match[1]}\` instead`;
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

  async process(input: Input) {
    let quickReturn = true;
    let output = '';

    const words = input.args;

    for (let i = 0; i < words.length; i += 1) {
      const command = this.getCommand(words[i], input.message);

      if (command) {
        // Stop the immediate resolving
        quickReturn = false;

        let newStr = '';
        if (words.length !== 1) {
          newStr = words.splice(i + 1).join(' ');
        }

        // Make new command object and run it
        const newInput = input.from(new TextSendable(newStr));

        const sendable = await command.run(newInput);

        if (output && (sendable instanceof CompoundSendable)) {
          return sendable.from(new TextSendable(newStr));
        }

        return sendable;
      } else {
        // Append word to output, and go to next word
        output = `${output ? `${output} ` : ''}${words[i]}`;
      }
    }

    // No commands found, just return
    if (output) {
      return new TextSendable(output);
    }
  }

  private onMessage(msg: Message) {
    const connConf = this.getConnectionConfig(msg.connection);
    const server = msg.server;

    let serverConfig: IServerConfig;
    if (server) {
      // Check connection's server filter
      if (connConf) {
        if (connConf.filter) {
          const filter = connConf.filter;

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
      }

      // Server is allowed, get config
      serverConfig = this.getServerConfig(server);
    } else {
      serverConfig = this.config.defaults.server;
    }

    console.log(`${msg.user.name}: ${msg.text}`);

    // Send message to all addons that want it

    // TODO: Filter out bots

    // Safeguard against strikethrough triggering commands
    if (serverConfig.prefix === '~' && msg.text.match('^~~')) {
      return;
    }

    // Messages should start with a command
    if (!msg.text.match(new RegExp(`^${regexEscape(serverConfig.prefix)}`))) {
      return;
    }

    // Process it!
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
            const addon: Addon = new addonClass(this);

            if (this.addons.has(addon.id)) {
              // this.error(`addon ${addon.id} has already been created`);
              return null;
            }

            this.addons.set(addon.id, addon);

            return addon;
          } catch (err) {
            // this.error(`unable to create addon ${file}`);
            // this.error(err);
            return null;
          }

        } else if (file.match(/\.json$/)) {
          const addonData: IObjectMap<string> = require(file);

          return new JSONAddon(this, file, addonData);
        } else {
          return null;
        }
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
