import {
  appendFile,
  readdir,
  readFile,
} from 'fs';
import { join as joinPath } from 'path';

import Bot from './Bot';

import Addon from '../common/Addon';
import User from '../common/User';
import Server from '../common/Server';
import Channel from '../common/Channel';
import Message from '../common/Message';

import BotError from '../errors/BotError';
import {
  LoggerInvalidIdError,
  LoggerFileReadError,
  LoggerFileWriteError,
  LoggerInvalidTypeError,
} from '../errors/LoggerError';

interface LogLine {
  [x: string]: any;
  timestamp: number;
  type: string;
  message: string;
}

/**
 * Handles reading/writing of logs
 *
 * @class Logger
 */
export default class Logger {
  private readonly bot: Bot;
  private readonly dir: string;
  private readonly cache: Map<number, LogLine[]>;
  private currentId: number;
  private maxLogLength: number;

  /**
   * Creates an instance of Logger.
   *
   * @param {Bot} bot
   * @param {string} directory
   * @param {number} size
   *
   * @memberOf Logger
   */
  constructor(bot: Bot, directory: string, size = 5000) {
    this.bot = bot;
    this.dir = directory;
    this.cache = new Map<number, LogLine[]>();
    this.currentId = null;
    this.maxLogLength = size;
  }

  /**
   * Starts the logger
   *
   * @returns {Promise} Resolves when logger is ready to accept messages
   *
   * @memberOf Logger
   */
  async start() {
    const files = await this.listDirectory(this.dir)
      .then(a => a.filter(f => f.match(/^\d+\.log$/)));

    if (files.length === 0) {
      this.currentId = 0;
    } else {
      this.currentId = files
        .map(n => Number.parseInt(n)) // parseInt ignores everything that isn't a number
        .reduce((max, curr) => Math.max(max, curr));
    }

    await this.getLogFile(this.currentId);

    return true;
  }

  /**
   * Gets the latest logs that match a particular function
   *
   * @param {function} filter
   * @param {number} [limit=80]
   *
   * @memberOf Logger
   */
  async getLogs(filter, limit = 80) {
    return await this.filterLogs(filter, limit, this.currentId);
  }

  async log(message, location) {
    const line: LogLine = {
      timestamp: Date.now(),
      type: 'unassigned',
      message: '',
    };

    // Message type specific stuff
    if (message instanceof Message) {
      line.type = 'message';
      line.id = message.id;
      line.author = message.user.id;
      line.name = message.user.name;
      line.message = message.text;

      if (location instanceof Channel) {
        line.channel = location.id;

        if (location.server) {
          line.server = location.server.id;
        }
      }
    } else {
      if (message instanceof BotError) {
        line.type = 'error';
        line.name = message.name;
        line.message = message.message;
        line.stack = message.stack;
      } else if (typeof message === 'string') {
        line.type = 'log';
        line.message = message;
      } else {
        throw new LoggerInvalidTypeError();
      }

      if (location instanceof Addon) {
        line.source = location.id;
      } else if (location instanceof Bot) {
        line.source = 'BOT';
      } else if (typeof location === 'string') {
        line.source = location;
      } else {
        line.source = '???';
      }
    }

    // Log to console
    if (line.type === 'message') {
      console.log(`> ${line.name}: ${line.message}`);
    } else if (line.type === 'error') {
      console.error(`[${line.source}][ERROR] ${line.message}`);
    } else {
      console.log(`[${line.source}] ${line.message}`);
    }

    // Append to file
    return new Promise<void>((resolve, reject) => {
      // Do filesystem stuff
      const lineStr = `${JSON.stringify(line)}\n`;
      appendFile(
        joinPath(
          '.',
          this.dir,
          `${this.currentId}.log`,
        ),
        lineStr,
        (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });

      // Add to cache
      if (!this.cache.has(this.currentId)) {
        this.cache.set(this.currentId, []);
      }
      const set = this.cache.get(this.currentId);
      set.push(line);
      if (set.length >= this.maxLogLength) {
        this.currentId += 1;
      }
    });
  }

  private listDirectory(path: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      readdir(path, (err, data) => {
        if (err) {
          reject(new LoggerFileWriteError());
          return;
        }

        resolve(data);
      });
    });
  }

  // tslint:disable-next-line:max-line-length
  private async filterLogs(filter: (l: LogLine) => boolean, limit: number, id: number): Promise<LogLine[]> {
    const lines = await this.getLogFile(id);
    const filtered = lines.filter(filter);

    if (lines.length === limit) {
      return lines;
    } else if (lines.length < limit) {
      const remaining = limit - lines.length;

      try {
        return await this.filterLogs(filter, remaining, id - 1)
          .then(r => lines.concat(r));
      } catch (error) {
        return [];
      }
    } else {
      return lines.splice(limit * -1, limit);
    }
  }


  private async getLogFile(id: number) {
    if (id < 0 || id > this.currentId) {
      throw new LoggerInvalidIdError(id);
    }

    if (this.cache.has(id)) {
      return this.cache.get(id);
    }

    let lines: LogLine[];
    try {
      const str = await this.readFile(id);
      lines = this.parseLog(str);
    } catch (err) {
      lines = [];
    }

    this.cache.set(id, lines);

    return lines;
  }

  /**
   * Reads a log file
   *
   * @param {number} id
   * @returns {Promise<string>} Resolves with file contents
   *
   * @memberOf Logger
   */
  private async readFile(id) {
    return new Promise<string>((resolve, reject) => {
      readFile(
        joinPath(
          '.',
          this.dir,
          `${id}.log`,
        ),
        'utf8',
        (err, data) => {
          if (err) {
            reject(new LoggerFileReadError(id));
            return;
          }
          resolve(data);
        });
    });
  }

  /**
   * Parses the log data into an array
   *
   * @param {string} data
   * @returns {Promise<Array>} Resolves with parsed data
   *
   * @memberOf Logger
   */
  private parseLog(data: string): LogLine[] {
    return data.split(/\r?\n/)
      .filter(l => !l.match(/^#|^\/\/|(?:^.{0}$)/)) // Remove comments and newline
      .map(l => JSON.parse(l));
  }
}

export function filterByServer(server: Server) {
  return (line) => {
    if (line.type !== 'message') {
      return false;
    }
    if (line.server !== server.id) {
      return false;
    }

    return true;
  };
}

export function filterByChannel(channel: Channel) {
  return (line) => {
    if (line.type !== 'message') {
      return false;
    }
    if (line.channel !== channel.id) {
      return false;
    }

    return true;
  };
}

export function filterByUser(user: User) {
  return (line) => {
    if (line.type !== 'message') {
      return false;
    }
    if (line.author !== user.id) {
      return false;
    }

    return true;
  };
}

export function filterByAddon(addon: Addon) {
  return (line) => {
    if (line.type !== 'log') {
      return false;
    }
    if (line.source !== addon.id) {
      return false;
    }

    return true;
  };
}

export function filterByError(addon: Addon) {
  return (line) => {
    if (line.type !== 'error') {
      return false;
    }
    if (line.source !== addon.id) {
      return false;
    }

    return true;
  };
}
