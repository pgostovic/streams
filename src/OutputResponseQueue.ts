import { AsyncQueue, newQueueGenerator } from './AsyncQueue';
import { Anomaly, IMessage, Type } from './types';

/**
 * OutputResponseQueue
 *
 * Wrapper around AsyncQueue that enqueues values and dequeues
 * typed messages. For sending a response.
 */
export class OutputResponseQueue<T> {
  private q = new AsyncQueue<IMessage<T>>();
  private gen = newQueueGenerator<IMessage<T>>(this);

  constructor(iter?: AsyncIterableIterator<T>) {
    if (iter) {
      (async () => {
        try {
          for await (const val of iter) {
            this.enqueue(val);
          }
          this.flush();
        } catch (err) {
          if (err instanceof Anomaly) {
            this.q.enqueue({ type: Type.Anomaly, payload: { message: err.message, data: err.data } });
          } else {
            this.q.enqueue({ type: Type.InternalError, payload: { message: err.message } });
          }
          this.q.flush();
        }
      })();
    }
  }

  public set maxSize(maxSize) {
    this.q.maxSize = maxSize;
  }

  public get maxSize() {
    return this.q.maxSize;
  }

  public iterator() {
    return this.gen();
  }

  public async dequeue(): Promise<IMessage<T>> {
    return this.q.dequeue();
  }

  public enqueue(value: T) {
    this.q.enqueue({ type: Type.Value, payload: value });
  }

  public flush() {
    this.q.enqueue({ type: Type.End });
    this.q.flush();
  }
}
