/**
 * A object-based map of strings to type T.
 *
 * @export
 * @interface ObjectMap
 * @template T
 */
export default interface ObjectMap<T> {
  [x: string]: T,
}
