import Message from '../common/Message';
import ISendable from './ISendable';

export default interface ITargetable {
  send: (msg: ISendable) => Promise<Message>,
}
