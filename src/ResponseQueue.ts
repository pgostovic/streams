// tslint:disable: max-classes-per-file
import { AsyncQueue, FLUSH, newQueueGenerator } from './AsyncQueue';

export enum Type {
  Value = 'v',
  End = 'e',
  InternalError = 'err',
  Anomaly = 'an',
}

interface IErrorValue {
  message: string;
  data?: { [key: string]: string | number | boolean };
}

interface IValueMessage<T> {
  type: Type.Value;
  value: T;
}

interface IEndMessage {
  type: Type.End;
}

interface IErrorMessage {
  type: Type.InternalError | Type.Anomaly;
  value: IErrorValue;
}

export type IMessage<T> = IValueMessage<T> | IEndMessage | IErrorMessage;

/**
 * InputResponseQueue
 *
 * Wrapper around AsyncQueue that enqueues typed messages and dequeues
 * values.
 */
export class InputResponseQueue<T> {
  private q = new AsyncQueue<IMessage<T>>();
  private gen = newQueueGenerator<T>(this);

  constructor(iter?: AsyncIterableIterator<IMessage<T>>) {
    if (iter) {
      (async () => {
        for await (const val of iter) {
          this.enqueue(val);
        }
      })();
    }
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
        throw new Error(errorMessage.value.message);
      }

      case Type.Anomaly: {
        const errorMessage = message as IErrorMessage;
        throw new Anomaly(errorMessage.value.message, errorMessage.value.data);
      }

      case Type.Value:
        return (message as IValueMessage<T>).value;

      case Type.End:
        throw FLUSH;
    }
  }
}

/**
 * OutputResponseQueue
 *
 * Wrapper around AsyncQueue that enqueues values and dequeues
 * typed messages.
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
            this.q.enqueue({ type: Type.Anomaly, value: { message: err.message, data: err.data } });
          } else {
            this.q.enqueue({ type: Type.InternalError, value: { message: err.message } });
          }
          this.q.flush();
        }
      })();
    }
  }

  public iterator() {
    return this.gen();
  }

  public enqueue(value: T) {
    this.q.enqueue({ type: Type.Value, value });
  }

  public flush() {
    this.q.enqueue({ type: Type.End });
    this.q.flush();
  }

  public async dequeue(): Promise<IMessage<T>> {
    return this.q.dequeue();
  }
}

export class Anomaly extends Error {
  public data: {
    [key: string]: string | number | boolean;
  };

  constructor(message: string, data = {}) {
    super(message);
    this.data = data;
  }
}
