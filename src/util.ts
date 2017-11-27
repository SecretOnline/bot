import IObjectMap from './interfaces/IObjectMap';

export const pkg = require('../package.json');

/**
 * No-op
 *
 * @export
 */
export function noop() {}

/**
 * Similar to Array.map, but for Object literals
 *
 * @export
 * @template T
 * @param {IObjectMap<T>} obj
 * @param {(key: string, value: T) => any} fn
 * @returns {IObjectMap<any>}
 */
export function mapObject<T>(
  obj: IObjectMap<T>,
  fn: (key: string, value: T) => any,
): IObjectMap<any> {
  const results = Object.keys(obj)
    .map(k => [k, fn(k, obj[k])]);

  const res = {};

  results.forEach(([k, v]) => {
    res[k] = v;
  });

  return res;
}

const quoteSplitExp = /(?:([^\"\`]\S*)|\"(.*?)\"|\`(.*?)\`)\s*/g;
/**
 * Splits a string into words or "quoted" sections
 *
 * @export
 * @param {any} str String to split
 * @returns {string[]}
 */
export function quoteSplit(str: string) {
  const arr: string[] = [];

  let item = quoteSplitExp.exec(str);
  while (item !== null) {
    const words = item[1] || item[2] || '';
    arr.push(words);
    item = quoteSplitExp.exec(str);
  }

  return arr;
}

/**
 * Escapes special characters in regex
 *
 * @export
 * @param {string} str String to escape
 * @returns
 */
export function regexEscape(str: string) {
  return str.replace(/[-[\]{}()*+?.,\\/^$|#\s]/g, '\\$&');
}

/**
 * Returns a promise that resolves with no content after
 * the given number of milliseconds have passed
 *
 * @param {number} ms Number of milliseconds to delay by
 * @returns {Promise<void>}
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
  });
}

export function promiseChain<T>(functions: ((prev?: T) => Promise<T>)[], initial?: T) {
  if (functions.length === 0) {
    return Promise.resolve(initial);
  }
  return functions.reduce(
    (prom, nextFunc) => {
      return prom
        .then((res) => {
          return nextFunc(res);
        });
    },
    Promise.resolve(initial),
  );
}

export function arrayRandom<T>(arr: T[]) {
  if (arr.length) {
    const index = Math.floor(Math.random() * arr.length);
    return arr[index];
  }
}


/**
 * Truncates a string
 *
 * @export
 * @param {string} str String to truncate
 * @param {number} [len=80] Length to truncate to
 * @param {string} [replace='...'] String to replace end with
 * @returns
 */
export function truncate(str, len = 80, replace = '...') {
  if (str.length < len) {
    return str;
  } else {
    return `${str.substr(0, len - replace.length)}${replace}`;
  }
}
