import Message from '../common/Message';
import ISendable from './ISendable';

/**
 * An interface that can be the target of a message
 *
 * @interface ITargetable
 * @export
 */
export default interface ITargetable {
  send: (msg: ISendable) => Promise<Message>;
}
