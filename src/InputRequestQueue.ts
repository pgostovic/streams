import { AsyncQueue, newQueueGenerator } from './AsyncQueue';
import { IValueMessage } from './types';

/**
 * InputRequestQueue
 *
 * Wrapper around AsyncQueue that enqueues typed messages and dequeues
 * values. For receiving a request.
 */

export class InputRequestQueue<T> {
  private q = new AsyncQueue<IValueMessage<T>>();
  private gen = newQueueGenerator<T>(this);

  constructor(iter?: AsyncIterableIterator<IValueMessage<T>>) {
    if (iter) {
      (async () => {
        for await (const message of iter) {
          this.enqueue(message);
        }
      })();
    }
  }

  public iterator() {
    return this.gen();
  }

  public enqueue(message: IValueMessage<T>) {
    this.q.enqueue(message);
  }

  public async dequeue(): Promise<T> {
    return (await this.q.dequeue()).payload;
  }

  public flush() {
    this.q.flush();
  }
}
