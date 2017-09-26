import IObjectMap from './interfaces/IObjectMap';

export function mapObject<T>(obj: IObjectMap<T>, fn: (key: string, value: T) => any) {
  return Object.keys(obj)
    .map(k => fn(k, obj[k]));
}
