import { Anomaly, IMessage, OutputResponseQueue, Type } from '..';

describe('OutputResponseQueue', () => {
  describe('Enqueue a single value', () => {
    it('should iterate through one value', async () => {
      const q = new OutputResponseQueue<string>();

      const results: Array<IMessage<string>> = [];

      await Promise.all([
        (async () => {
          q.enqueue('hello');
          q.flush();
        })(),
        (async () => {
          for await (const value of q.iterator()) {
            results.push(value);
          }
        })(),
      ]);

      expect(results).toEqual([{ type: Type.Value, value: 'hello' }, { type: Type.End }]);
    });
  });

  describe('Enqueue a multiple values', () => {
    it('should iterate through all messages', async () => {
      const q = new OutputResponseQueue<string>();

      const results: Array<IMessage<string>> = [];

      await Promise.all([
        (async () => {
          q.enqueue('hey');
          q.enqueue('ho');
          q.enqueue("let's");
          q.enqueue('go');
          q.flush();
        })(),
        (async () => {
          for await (const value of q.iterator()) {
            results.push(value);
          }
        })(),
      ]);

      expect(results).toEqual([
        { type: Type.Value, value: 'hey' },
        { type: Type.Value, value: 'ho' },
        { type: Type.Value, value: "let's" },
        { type: Type.Value, value: 'go' },
        { type: Type.End },
      ]);
    });
  });

  describe('Initialize with an iterator', () => {
    it('should iterate through all enqueued values', async () => {
      const q = new OutputResponseQueue<string>(
        (async function*() {
          yield 'hey';
          yield 'ho';
          yield "let's";
          yield 'go';
        })(),
      );

      const results: Array<IMessage<string>> = [];

      for await (const value of q.iterator()) {
        results.push(value);
      }

      expect(results).toEqual([
        { type: Type.Value, value: 'hey' },
        { type: Type.Value, value: 'ho' },
        { type: Type.Value, value: "let's" },
        { type: Type.Value, value: 'go' },
        { type: Type.End },
      ]);
    });
  });

  describe('Initialize with an iterator that throws an Error', () => {
    it('should iterate through all enqueued values', async () => {
      const q = new OutputResponseQueue<string>(
        (async function*() {
          if (Date.now() === 0) {
            yield 'nope';
          }
          throw new Error('The Error');
        })(),
      );

      const results: Array<IMessage<string>> = [];

      for await (const message of q.iterator()) {
        results.push(message);
      }

      expect(results).toEqual([{ type: Type.InternalError, value: { message: 'The Error' } }]);
    });
  });

  describe('Initialize with an iterator that throws an Anomaly', () => {
    it('should iterate through all enqueued values', async () => {
      const q = new OutputResponseQueue<string>(
        (async function*() {
          if (Date.now() === 0) {
            yield 'nope';
          }
          throw new Anomaly('The Anomaly');
        })(),
      );

      const results: Array<IMessage<string>> = [];

      for await (const message of q.iterator()) {
        results.push(message);
      }

      expect(results).toEqual([{ type: Type.Anomaly, value: { message: 'The Anomaly', data: {} } }]);
    });
  });

  describe('With maxSize set', () => {
    it('should throw when enqueueing beyond maxSize', async () => {
      const q = new OutputResponseQueue<string>();
      q.maxSize = 4;

      expect(q.maxSize).toBe(4);

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
});
