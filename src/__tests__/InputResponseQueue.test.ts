import { Anomaly, IMessage, InputResponseQueue, Type } from '..';

describe('InputResponseQueue', () => {
  describe('Enqueue a single, final message', () => {
    it('should iterate through one value', async () => {
      const q = new InputResponseQueue<string>();

      const results: string[] = [];

      await Promise.all([
        (async () => {
          q.enqueue({ type: Type.Value, value: 'hello' });
          q.enqueue({ type: Type.End });
        })(),
        (async () => {
          for await (const value of q.iterator()) {
            results.push(value);
          }
        })(),
      ]);

      expect(results).toEqual(['hello']);
    });
  });

  describe('Enqueue multiple messages and a final message', () => {
    it('should iterate through one value', async () => {
      const q = new InputResponseQueue<string>();

      const results: string[] = [];

      await Promise.all([
        (async () => {
          q.enqueue({ type: Type.Value, value: 'hey' });
          q.enqueue({ type: Type.Value, value: 'ho' });
          q.enqueue({ type: Type.Value, value: "let's" });
          q.enqueue({ type: Type.Value, value: 'go' });
          q.enqueue({ type: Type.End });
        })(),
        (async () => {
          for await (const value of q.iterator()) {
            results.push(value);
          }
        })(),
      ]);

      expect(results).toEqual(['hey', 'ho', "let's", 'go']);
    });
  });

  describe('Enqueue an internal error', () => {
    it('should throw an Error', async () => {
      const q = new InputResponseQueue<string>();

      const results: string[] = [];

      await Promise.all([
        (async () => {
          q.enqueue({ type: Type.InternalError, value: { message: 'The Error' } });
        })(),
        (async () => {
          try {
            for await (const value of q.iterator()) {
              results.push(value);
            }
            fail('Should have thrown');
          } catch (err) {
            expect(err).toBeInstanceOf(Error);
            expect(err.message).toBe('The Error');
          }
        })(),
      ]);

      expect(results).toEqual([]);
    });
  });

  describe('Enqueue an anomaly', () => {
    it('should throw an Anomaly', async () => {
      const q = new InputResponseQueue<string>();

      const results: string[] = [];

      await Promise.all([
        (async () => {
          q.enqueue({ type: Type.Anomaly, value: { message: 'The Anomaly' } });
        })(),
        (async () => {
          try {
            for await (const value of q.iterator()) {
              results.push(value);
            }
            fail('Should have thrown');
          } catch (err) {
            expect(err).toBeInstanceOf(Anomaly);
            expect(err.message).toBe('The Anomaly');
          }
        })(),
      ]);

      expect(results).toEqual([]);
    });
  });

  describe('Initialize with an iterator', () => {
    it('should iterate through all enqueued values', async () => {
      const q = new InputResponseQueue<string>(
        (async function*() {
          yield { type: Type.Value, value: 'hey' } as IMessage<string>;
          yield { type: Type.Value, value: 'ho' } as IMessage<string>;
          yield { type: Type.Value, value: "let's" } as IMessage<string>;
          yield { type: Type.Value, value: 'go' } as IMessage<string>;
          yield { type: Type.End } as IMessage<string>;
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
