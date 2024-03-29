import { AsyncQueue } from '..';

const wait = (millis = 0): Promise<void> =>
  new Promise(resolve => {
    setTimeout(resolve, millis);
  });

describe('AsyncQueue', () => {
  describe('Consuming via iterator', () => {
    describe('When values are enqueued before consumption', () => {
      it('should iterate through all enqueued values', async () => {
        const q = new AsyncQueue<string>();

        const results: string[] = [];

        await Promise.all([
          (async () => {
            q.enqueue('hey');
            q.enqueue('ho');
            q.enqueue("let's");
            q.enqueue('go');
            q.flush();
          })(),
          (async () => {
            await wait(10);
            for await (const value of q) {
              results.push(value);
            }
          })(),
        ]);

        expect(results).toEqual(['hey', 'ho', "let's", 'go']);
      });
    });

    describe('When consumption starts before data is enqueued', () => {
      it('should iterate through all enqueued values', async () => {
        const q = new AsyncQueue<string>();

        const results: string[] = [];

        await Promise.all([
          (async () => {
            await wait(10);
            q.enqueue('hey');
            q.enqueue('ho');
            q.enqueue("let's");
            q.enqueue('go');
            q.flush();
          })(),
          (async () => {
            for await (const value of q) {
              results.push(value);
            }
          })(),
        ]);

        expect(results).toEqual(['hey', 'ho', "let's", 'go']);
      });
    });

    describe('When flushed between enqueues', () => {
      it('should iterate through multiple iterators', async () => {
        const is = new AsyncQueue<string>();

        const results1: string[] = [];
        const results2: string[] = [];

        await Promise.all([
          (async () => {
            is.enqueue('all');
            is.enqueue('work');
            is.enqueue('and');
            is.enqueue('no');
            is.enqueue('play');
            is.flush();

            is.enqueue('makes');
            is.enqueue('jack');
            is.enqueue('a');
            is.enqueue('dull');
            is.enqueue('boy');
            is.flush();
          })(),
          (async () => {
            for await (const value of is) {
              results1.push(value);
            }

            for await (const value of is) {
              results2.push(value);
            }
          })(),
        ]);

        expect(results1).toEqual(['all', 'work', 'and', 'no', 'play']);
        expect(results2).toEqual(['makes', 'jack', 'a', 'dull', 'boy']);
      });
    });
  });

  describe('Consuming via dequeue', () => {
    it('should iterate through all enqueued values and throw when done', async () => {
      const q = new AsyncQueue<string>();

      const results: string[] = [];

      await Promise.all([
        (async () => {
          q.enqueue('hey');
          q.enqueue('ho');
          q.enqueue("let's");
          q.enqueue('go');
          q.flush();
        })(),
        (async () => {
          results.push(await q.dequeue());
          results.push(await q.dequeue());
          results.push(await q.dequeue());
          results.push(await q.dequeue());

          try {
            await q.dequeue();
            fail('Should have thrown');
          } catch (err) {
            expect(err).toBeInstanceOf(Error);
          }
        })(),
      ]);

      expect(results).toEqual(['hey', 'ho', "let's", 'go']);
    });
  });

  describe('Consuming via dequeue, then iterator', () => {
    it('should iterate through all enqueued values', async () => {
      const q = new AsyncQueue<string>();

      const results: string[] = [];

      await Promise.all([
        (async () => {
          q.enqueue('hey');
          q.enqueue('ho');
          q.enqueue("let's");
          q.enqueue('go');
          q.flush();
        })(),
        (async () => {
          results.push(await q.dequeue());
          results.push(await q.dequeue());

          for await (const value of q) {
            results.push(value);
          }
        })(),
      ]);

      expect(results).toEqual(['hey', 'ho', "let's", 'go']);
    });
  });

  describe('Initialize with an iterator', () => {
    it('should iterate through all enqueued values', async () => {
      const q = new AsyncQueue<string>(
        (async function*() {
          yield 'hey';
          yield 'ho';
          await wait(10);
          yield "let's";
          yield 'go';
        })(),
      );

      const results: string[] = [];

      for await (const value of q) {
        results.push(value);
      }

      expect(results).toEqual(['hey', 'ho', "let's", 'go']);
    });
  });

  describe('With maxSize set', () => {
    it('should throw when enqueueing beyond maxSize', async () => {
      const q = new AsyncQueue<string>();
      q.maxSize = 4;

      q.enqueue('hey');
      q.enqueue('ho');
      q.enqueue("let's");
      q.enqueue('go');

      try {
        q.enqueue('too far');
        fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
      }
    });
  });

  describe('With maxWaitTime set', () => {
    it('should throw when enqueue wait exceeds maxWaitTime', async () => {
      const q = new AsyncQueue<string>();
      q.maxWaitTime = 10;

      const results: string[] = [];

      await Promise.all([
        (async () => {
          q.enqueue('hey');
          await wait(5);
          q.enqueue('ho');
          await wait(20);
          q.enqueue("let's");
          q.enqueue('go');
          q.flush();
        })(),
        (async () => {
          try {
            for await (const value of q) {
              results.push(value);
            }
            fail('Should have thrown');
          } catch (err) {
            expect(err).toBeInstanceOf(Error);
          }
        })(),
      ]);

      expect(results).toEqual(['hey', 'ho']);
    });
  });
});
