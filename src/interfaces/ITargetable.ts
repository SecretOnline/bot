import Message from '../common/Message';
import Sendable from '../common/Sendable';

interface SendFunction {
  (msg: Sendable): Promise<Message>,
}

export default interface ITargetable {
  send: (msg: Sendable) => Promise<Message>,
}
