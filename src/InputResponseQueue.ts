// tslint:disable: max-classes-per-file
import { AsyncQueue, FLUSH, newQueueGenerator } from './AsyncQueue';
import { Anomaly, IErrorMessage, IMessage, IValueMessage, Type } from './types';

/**
 * InputResponseQueue
 *
 * Wrapper around AsyncQueue that enqueues typed messages and dequeues
 * values. For receiving a response.
 */
export class InputResponseQueue<T> {
  private q = new AsyncQueue<IMessage<T>>();
  private gen = newQueueGenerator<T>(this);

  constructor(iter?: AsyncIterableIterator<IMessage<T>>) {
    if (iter) {
      (async () => {
        for await (const message of iter) {
          this.enqueue(message);
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

  public enqueue(message: IMessage<T>) {
    this.q.enqueue(message);
  }

  public async dequeue(): Promise<T> {
    const message = await this.q.dequeue();

    switch (message.type) {
      case Type.InternalError: {
        const errorMessage = message as IErrorMessage;
        throw new Error(errorMessage.payload.message);
      }

      case Type.Anomaly: {
        const errorMessage = message as IErrorMessage;
        throw new Anomaly(errorMessage.payload.message, errorMessage.payload.data);
      }

      case Type.Value:
        return (message as IValueMessage<T>).payload;

      case Type.End:
        throw FLUSH;
    }
  }

  public async dequeueAll(): Promise<T[]> {
    const values: T[] = [];
    for await (const value of this.iterator()) {
      values.push(value);
    }
    return values;
  }
}
