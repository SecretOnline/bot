import Message from '../common/Message';

export default interface IConnectionEvents {
  on(event: 'message', listener: (msg: Message) => void): this,
}
