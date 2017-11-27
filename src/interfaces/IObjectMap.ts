/**
 * A object-based map of strings to type T.
 *
 * @export
 * @interface IObjectMap
 * @template T
 */
export default interface IObjectMap<T> {
  [x: string]: T;
}
