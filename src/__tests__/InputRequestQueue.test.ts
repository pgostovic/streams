import { InputRequestQueue, Type } from '..';
import { IValueMessage } from '../types';

describe('InputRequestQueue', () => {
  describe('Enqueue a few messages', () => {
    it('should iterate through all values', async () => {
      const q = new InputRequestQueue<string>();

      const results: string[] = [];

      await Promise.all([
        (async () => {
          q.enqueue({ type: Type.Value, payload: 'hey' });
          q.enqueue({ type: Type.Value, payload: 'ho' });
          q.enqueue({ type: Type.Value, payload: "let's" });
          q.enqueue({ type: Type.Value, payload: 'go' });
          q.flush();
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

  describe('Enqueue a few messages with an iterator', () => {
    it('should iterate through all values', async () => {
      const q = new InputRequestQueue<string>(
        (async function*() {
          yield { type: Type.Value, payload: 'hey' } as IValueMessage<string>;
          yield { type: Type.Value, payload: 'ho' } as IValueMessage<string>;
          yield { type: Type.Value, payload: "let's" } as IValueMessage<string>;
          yield { type: Type.Value, payload: 'go' } as IValueMessage<string>;
        })(),
      );

      const results: string[] = [];

      await Promise.all([
        (async () => {
          await wait(10);
          q.flush();
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
});

const wait = (millis: number = 0) =>
  new Promise(resolve => {
    setTimeout(resolve, millis);
  });
