import { AsyncQueue } from '..';

describe('AsyncQueue', () => {
  describe('Consuming via iterator', () => {
    describe('When values are enqueued before consumption', () => {
      it('should iterate through all enqueued values', async () => {
        const q = new AsyncQueue<string>();

        const results: string[] = [];

        await Promise.all([
          (async () => {
            await wait(10);
            for await (const value of q.iterator()) {
              results.push(value);
            }
          })(),
          (async () => {
            q.enqueue('hey');
            q.enqueue('ho');
            q.enqueue("let's");
            q.enqueue('go');
            q.flush();
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
            for await (const value of q.iterator()) {
              results.push(value);
            }
          })(),
          (async () => {
            await wait(10);
            q.enqueue('hey');
            q.enqueue('ho');
            q.enqueue("let's");
            q.enqueue('go');
            q.flush();
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
            for await (const value of is.iterator()) {
              results1.push(value);
            }

            for await (const value of is.iterator()) {
              results2.push(value);
            }
          })(),
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
        (async () => {
          q.enqueue('hey');
          q.enqueue('ho');
          q.enqueue("let's");
          q.enqueue('go');
          q.flush();
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
          results.push(await q.dequeue());
          results.push(await q.dequeue());

          for await (const value of q.iterator()) {
            results.push(value);
          }
        })(),
        (async () => {
          q.enqueue('hey');
          q.enqueue('ho');
          q.enqueue("let's");
          q.enqueue('go');
          q.flush();
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

      for await (const value of q.iterator()) {
        results.push(value);
      }

      expect(results).toEqual(['hey', 'ho', "let's", 'go']);
    });
  });
});

const wait = (millis: number = 0) =>
  new Promise(resolve => {
    setTimeout(resolve, millis);
  });
