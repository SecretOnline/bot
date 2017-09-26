import { readdir } from 'fs';
import { join as joinPath } from 'path';

import ObjectMap from '../types/ObjectMap';

import Connection, { ConnectionConfig } from '../common/Connection';

interface BotConfig {
  connections: ObjectMap<ConnectionConfig>,
  paths: ObjectMap<string>,
}

export default class Bot {
  private config: BotConfig;
  private connections = new Map<string, Connection>();

  async start(config: BotConfig) {
    this.config = config;
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
}
