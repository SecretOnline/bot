import {
  readdir ,
  writeFile,
} from 'fs';
import { join as joinPath } from 'path';

import IObjectMap from '../interfaces/IObjectMap';

import Connection, { IConnectionConfig } from '../common/Connection';
import Addon, { IAddonConfig } from '../common/Addon';
import Server, { IServerConfig } from '../common/Server';
import JSONAddon from '../common/JSONAddon';
import Message from '../common/Message';

interface BotConfig {
  connections: IObjectMap<IConnectionConfig>;
  addons: IObjectMap<IAddonConfig>;
  paths: IObjectMap<string>;
  defaults: {
    server: IServerConfig;
  };
}

export default class Bot {
  private config: BotConfig;
  private connections = new Map<string, Connection>();
  private addons = new Map<string, Addon>();
  private serverConfigs = new Map<string, IServerConfig>();

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

  getConnectionConfig(conn: Connection) {
    return this.config.connections[conn.id];
  }

  getAddonConfig(addon: Addon, context?: Server) {
    if (context) {
      // TODO: get server-specific addon config
      return null;
    }

    return this.config.addons[addon.id];
  }

  getServerConfig(server: Server) {
    if (!this.serverConfigs.has(server.id)) {
      this.serverConfigs.set(server.id, this.newServerConfig(server));
      this.writeServerConfig(server);
    }

    return this.serverConfigs.get(server.id);
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

    // Safeguard against strikethrough triggering commands
    if (serverConfig.prefix === '~' && msg.text.match('^~~')) {
      return;
    }
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
