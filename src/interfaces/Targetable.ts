import Message from './Message';
import Sendable from '../common/Sendable';

interface SendFunction {
  (msg: Sendable): Promise<Message>,
}

export default interface Targetable {
  send: SendFunction,
}
