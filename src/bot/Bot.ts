import { readdir } from 'fs';
import { join as joinPath } from 'path';

import IObjectMap from '../interfaces/IObjectMap';

import Connection, { IConnectionConfig } from '../common/Connection';

interface BotConfig {
  connections: IObjectMap<IConnectionConfig>,
  paths: IObjectMap<string>,
}

export default class Bot {
  private config: BotConfig;
  private connections = new Map<string, Connection>();

  async start(config: BotConfig) {
    this.config = config;

    let connectionFiles = await this.listDirectory(joinPath(
      '.',
      this.config.paths.connections
    ));
    let connections = await this.createConnections(
      connectionFiles
        .map(p => joinPath('../..', this.config.paths.connections, p))
    );
    return await this.initConnections(connections);
  }

  getConfig(obj: Connection) {
    if (obj instanceof Connection) {
      return this.config.connections[obj.id];
    }

    return null;
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
    let connections: Connection[] = files
      .map(file => {
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
            let conn: Connection = new connClass();

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
            .start(this.getConfig(conn))
            .then((result) => {
              // Add message listener for connection
              conn.on('message', (m) => { console.log(`${m.user.name}: ${m.text}`); })
              return result;
            }, (err): boolean => {
              // this.error(`unable to start connection ${conn.name}`);
              // this.error(err);
              return false;
            })
        })
    )
  }
}
