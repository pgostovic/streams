import { OutputRequestQueue, Type } from '..';
import { IValueMessage } from '../types';

describe('OutputRequestQueue', () => {
  describe('Enqueue a few values', () => {
    it('should iterate through all messages', async () => {
      const q = new OutputRequestQueue<string>();

      const results: Array<IValueMessage<string>> = [];

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
        { type: Type.Value, payload: 'hey' },
        { type: Type.Value, payload: 'ho' },
        { type: Type.Value, payload: "let's" },
        { type: Type.Value, payload: 'go' },
      ]);
    });
  });

  describe('Enqueue a few values with an iterator', () => {
    it('should iterate through all messages', async () => {
      const q = new OutputRequestQueue<string>(
        (async function*() {
          yield 'hey';
          yield 'ho';
          yield "let's";
          yield 'go';
        })(),
      );

      const results: Array<IValueMessage<string>> = [];

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

      expect(results).toEqual([
        { type: Type.Value, payload: 'hey' },
        { type: Type.Value, payload: 'ho' },
        { type: Type.Value, payload: "let's" },
        { type: Type.Value, payload: 'go' },
      ]);
    });
  });
});

const wait = (millis: number = 0) =>
  new Promise(resolve => {
    setTimeout(resolve, millis);
  });
