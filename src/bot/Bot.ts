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

  async start(config: BotConfig) {
    this.config = config;
  }
}
