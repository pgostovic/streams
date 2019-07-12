/**
 * AsyncQueue
 *
 */

export class AsyncQueue<T> {
  private iter: () => AsyncIterableIterator<T>;
  private resolverQueue: Array<IResolver<T | undefined>> = [];
  private waitForEnqueue: IResolver<void> = newResolver<void>();

  constructor() {
    const that = this;

    this.iter = async function*() {
      while (true) {
        const value = await that.dequeueValue();
        if (!value) {
          break;
        }
        yield value;
      }
    };
  }

  public enqueue(value: T) {
    this.enqueueValue(value);
  }

  public async dequeue(): Promise<T> {
    const value = await this.dequeueValue();
    if (value) {
      return value;
    }
    throw new Error('hello');
  }

  public flush() {
    this.enqueueValue(undefined);
  }

  public iterator(): AsyncIterableIterator<T> {
    return this.iter();
  }

  private enqueueValue(value?: T) {
    this.waitForEnqueue.resolve();
    this.waitForEnqueue = newResolver<void>();
    const resolver = newResolver<T | undefined>();
    this.resolverQueue.push(resolver);
    resolver.resolve(value);
  }

  private async dequeueValue(): Promise<T | undefined> {
    const resolver = this.resolverQueue.shift();
    if (resolver) {
      return await resolver.promise;
    } else {
      await this.waitForEnqueue.promise;
      return this.dequeue();
    }
  }
}

const newResolver = <R>(): IResolver<R> => {
  let r: ((value: R) => void) | undefined;
  let rej: ((err: Error) => void) | undefined;
  const p = new Promise<R>((resolve, reject) => {
    r = resolve;
    rej = reject;
  });
  return {
    resolve: r as (value: R) => void,
    reject: rej as (err: Error) => void,
    promise: p,
  };
};

interface IResolver<T> {
  resolve: (value: T) => void;
  reject: (err: Error) => void;
  promise: Promise<T>;
}
