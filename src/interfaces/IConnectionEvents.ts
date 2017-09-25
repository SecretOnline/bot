import Message from '../common/Message';

/**
 * An interface for the events that should be implemented on a Connection
 *
 * @interface IConnectionEvents
 * @export
 */
export default interface IConnectionEvents {
  on(event: 'message', listener: (msg: Message) => void): this,
}
