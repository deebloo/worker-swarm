/// <reference lib="webworker" />

import { WorkerSwarm } from './swarm';

describe('swarm', () => {
  it('should respond with a message from a single worker', (done) => {
    const workerUrl = createWorkerUrl(() => {
      self.postMessage('HELLO FROM FIRST');
    });

    const swarm = new WorkerSwarm([
      {
        name: 'first',
        workers: [new Worker(workerUrl)],
        handles: ['TEST'],
      },
    ]);

    swarm.post({ type: 'TEST' }).then((res) => {
      const data = res.map((m) => m.data);

      expect(data).toEqual(['HELLO FROM FIRST']);

      done();
    });
  });

  it('should respond with a message from a multiple workers', (done) => {
    const workerUrl1 = createWorkerUrl(() => {
      self.postMessage('HELLO FROM FIRST');
    });

    const workerUrl2 = createWorkerUrl(function () {
      self.postMessage('HELLO FROM SECOND');
    });

    const swarm = new WorkerSwarm([
      {
        name: 'first',
        workers: [new Worker(workerUrl1)],
        handles: ['TEST'],
      },
      {
        name: 'second',
        workers: [new Worker(workerUrl2)],
        handles: ['TEST'],
      },
    ]);

    swarm.post({ type: 'TEST' }).then((res) => {
      const data = res.map((m) => m.data);

      expect(data).toEqual(['HELLO FROM FIRST', 'HELLO FROM SECOND']);

      done();
    });
  });

  it('should on run workers who are marked that they can handle a given message type', (done) => {
    const workerUrl1 = createWorkerUrl(() => {
      self.postMessage('HELLO FROM FIRST');
    });

    const workerUrl2 = createWorkerUrl(() => {
      self.postMessage('HELLO FROM SECOND');
    });

    const swarm = new WorkerSwarm([
      {
        name: 'first',
        workers: [
          new Worker(workerUrl1),
          new Worker(workerUrl1),
          new Worker(workerUrl1),
          new Worker(workerUrl1),
        ],
        handles: ['TEST'],
      },
      {
        name: 'second',
        workers: [new Worker(workerUrl2)],
        handles: ['FOO'],
      },
    ]);

    swarm.post({ type: 'TEST' }).then((res) => {
      const data = res.map((m) => m.data);

      expect(data).toEqual(['HELLO FROM FIRST']);

      done();
    });
  });
});

function createWorkerUrl(fn: Function) {
  var blob = new Blob(['self.onmessage = ', fn.toString()], { type: 'text/javascript' });

  return URL.createObjectURL(blob);
}
