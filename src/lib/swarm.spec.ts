/// <reference lib="webworker" />

import { expect } from '@esm-bundle/chai';

import { WorkerSwarm, WorkerNode } from './swarm';

describe('swarm', () => {
  it('should respond with a message from a single worker', (done) => {
    const workerUrl = createWorkerUrl((e: MessageEvent) => {
      self.postMessage({ jobId: e.data.jobId, message: 'HELLO FROM FIRST' });
    });

    const swarm = new WorkerSwarm([
      {
        name: 'first',
        workers: [new Worker(workerUrl)],
        handles: ['TEST'],
      },
    ]);

    Promise.all(swarm.post({ type: 'TEST' })).then((res) => {
      const data = res.map((m) => m.data.message);

      expect(data).to.deep.equal(['HELLO FROM FIRST']);

      done();
    });
  });

  it('should correctly respond with a manual jobId', (done) => {
    const workerUrl = createWorkerUrl((e: MessageEvent) => {
      self.postMessage({ jobId: e.data.jobId, message: 'HELLO FROM FIRST' });
    });

    const swarm = new WorkerSwarm([
      {
        name: 'first',
        workers: [new Worker(workerUrl)],
        handles: ['TEST'],
      },
    ]);

    Promise.all(swarm.post({ type: 'TEST', jobId: 'TEST_JOB_ID' })).then((res) => {
      const data = res.map((m) => m.data.message);

      expect(data).to.deep.equal(['HELLO FROM FIRST']);

      done();
    });
  });

  it('should respond with a message from a multiple workers', (done) => {
    const workerUrl1 = createWorkerUrl((e: MessageEvent) => {
      self.postMessage({ jobId: e.data.jobId, message: 'HELLO FROM FIRST' });
    });

    const workerUrl2 = createWorkerUrl((e: MessageEvent) => {
      self.postMessage({ jobId: e.data.jobId, message: 'HELLO FROM SECOND' });
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

    Promise.all(swarm.post({ type: 'TEST' })).then((res) => {
      const data = res.map((m) => m.data.message);

      expect(data).to.deep.equal(['HELLO FROM FIRST', 'HELLO FROM SECOND']);

      done();
    });
  });

  it('should on run workers who are marked that they can handle a given message type', (done) => {
    const workerUrl1 = createWorkerUrl((e: MessageEvent) => {
      self.postMessage({ jobId: e.data.jobId, message: 'HELLO FROM FIRST' });
    });

    const workerUrl2 = createWorkerUrl((e: MessageEvent) => {
      self.postMessage({ jobId: e.data.jobId, message: 'HELLO FROM SECOND' });
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

    Promise.all(swarm.post({ type: 'TEST' })).then((res) => {
      const data = res.map((m) => m.data.message);

      expect(data).to.deep.equal(['HELLO FROM FIRST']);

      done();
    });
  });

  it('should increase a worker nodes load when initialized', () => {
    const workerUrl = createWorkerUrl(() => {});

    const swarm = new WorkerSwarm([
      {
        name: 'first',
        workers: [new Worker(workerUrl)],
        handles: ['TEST'],
      },
    ]);

    swarm.post({ type: 'TEST' });
    swarm.post({ type: 'TEST' });
    swarm.post({ type: 'TEST' });

    const workers = swarm.workerPool.get('first') as WorkerNode[];

    expect(workers[0].load).to.equal(3);
  });

  it('should distribute work evenly and send new jobs to the node with the lowest load', () => {
    const workerUrl = createWorkerUrl(() => {});

    const swarm = new WorkerSwarm([
      {
        name: 'first',
        workers: [new Worker(workerUrl), new Worker(workerUrl), new Worker(workerUrl)],
        handles: ['TEST'],
      },
    ]);

    swarm.post({ type: 'TEST' });
    swarm.post({ type: 'TEST' });
    swarm.post({ type: 'TEST' });

    const workers = swarm.workerPool.get('first') as WorkerNode[];

    expect(workers.map((node) => node.load)).to.deep.equal([1, 1, 1]);

    swarm.post({ type: 'TEST' });
    swarm.post({ type: 'TEST' });

    expect(workers.map((node) => node.load)).to.deep.equal([2, 1, 2]);
  });

  it('should decrease a worker nodes load when it completes', (done) => {
    const workerUrl = createWorkerUrl((e: MessageEvent) => {
      self.postMessage({ jobId: e.data.jobId });
    });

    const swarm = new WorkerSwarm([
      {
        name: 'first',
        workers: [new Worker(workerUrl)],
        handles: ['TEST'],
      },
    ]);

    Promise.all([
      ...swarm.post({ type: 'TEST' }),
      ...swarm.post({ type: 'TEST' }),
      ...swarm.post({ type: 'TEST' }),
    ]).then(() => {
      const workers = swarm.workerPool.get('first') as WorkerNode[];

      expect(workers[0].load).to.equal(0);

      done();
    });
  });
});

function createWorkerUrl(fn: Function) {
  var blob = new Blob(['self.onmessage = ', fn.toString()], { type: 'text/javascript' });

  return URL.createObjectURL(blob);
}
