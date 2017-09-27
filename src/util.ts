import IObjectMap from './interfaces/IObjectMap';

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
