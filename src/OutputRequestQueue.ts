import { AsyncQueue, newQueueGenerator } from './AsyncQueue';
import { IValueMessage, Type } from './types';

/**
 * OutputRequestQueue
 *
 * Wrapper around AsyncQueue that enqueues values and dequeues
 * typed messages. For sending a request.
 */

export class OutputRequestQueue<T> {
  private q = new AsyncQueue<IValueMessage<T>>();
  private gen = newQueueGenerator<IValueMessage<T>>(this);

  constructor(iter?: AsyncIterableIterator<T>) {
    if (iter) {
      (async () => {
        for await (const value of iter) {
          this.enqueue(value);
        }
      })();
    }
  }

  public iterator() {
    return this.gen();
  }

  public enqueue(value: T) {
    this.q.enqueue({ type: Type.Value, payload: value });
  }

  public dequeue(): Promise<IValueMessage<T>> {
    return this.q.dequeue();
  }

  public flush() {
    this.q.flush();
  }
}
