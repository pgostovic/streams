export const FLUSH = new Error('flush');

export const newQueueGenerator = <T>(q: { dequeue: () => Promise<T> }) =>
  async function*() {
    while (true) {
      try {
        yield await q.dequeue();
      } catch (err) {
        if (err === FLUSH) {
          break;
        } else {
          throw err;
        }
      }
    }
  };

const newResolver = <R>(): Resolver<R> => {
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

export class AsyncQueue<T> implements AsyncIterable<T> {
  public maxSize = 0;
  public maxWaitTime = 0;
  private gen = newQueueGenerator(this);
  private resolverQueue: Array<Resolver<T | undefined>> = [];
  private waitForEnqueue: Resolver<void> = newResolver<void>();

  constructor(iter?: AsyncIterableIterator<T>) {
    if (iter) {
      (async () => {
        for await (const val of iter) {
          this.enqueue(val);
        }
        this.flush();
      })();
    }
  }

  public enqueue(value: T): void {
    this.enqueueVal(value);
  }

  public flush(): void {
    this.enqueueVal(undefined);
  }

  /**
   * @deprecated Use `for await (const value of queue) {}` instead
   */
  public iterator(): AsyncIterableIterator<T> {
    return this.gen();
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    return this.gen();
  }

  public async dequeue(): Promise<T> {
    const resolver = this.resolverQueue.shift();
    if (resolver) {
      const value = await resolver.promise;
      if (value) {
        return value;
      }
      throw FLUSH;
    } else {
      const pid =
        this.maxWaitTime > 0
          ? setTimeout(() => {
              this.waitForEnqueue.reject(new Error(`Timed out waiting for enqueue (${this.maxWaitTime}ms)`));
            }, this.maxWaitTime)
          : 0;

      await this.waitForEnqueue.promise;

      if (pid !== 0) {
        clearTimeout(pid);
      }

      return this.dequeue();
    }
  }

  private enqueueVal(value?: T): void {
    if (this.maxSize > 0 && this.resolverQueue.length >= this.maxSize) {
      throw new Error(`Cannot exceed maximum queue size (${this.maxSize})`);
    }

    this.waitForEnqueue.resolve();
    this.waitForEnqueue = newResolver<void>();
    const resolver = newResolver<T | undefined>();
    this.resolverQueue.push(resolver);
    resolver.resolve(value);
  }
}

interface Resolver<T> {
  resolve: (value: T) => void;
  reject: (err: Error) => void;
  promise: Promise<T>;
}
