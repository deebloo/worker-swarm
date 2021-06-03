/// <reference lib="webworker" />

import { expect } from '@esm-bundle/chai';

import { WorkerRequest, WorkerResponse, WorkerSwarm } from './swarm';

describe('swarm', () => {
  it('should create two workers by default', () => {
    const workerUrl = createWorkerUrl((e: MessageEvent<WorkerRequest>) => {
      const message: WorkerResponse<{ payload: string }> = {
        jobId: e.data.jobId,
        payload: 'HELLO FROM FIRST',
      };

      self.postMessage(message);
    });

    const swarm = new WorkerSwarm(() => new Worker(workerUrl));

    expect(swarm.workerPool.length).to.equal(2);
  });

  it('should create the correct number of workers', () => {
    const workerUrl = createWorkerUrl((e: MessageEvent<WorkerRequest>) => {
      const message: WorkerResponse<{ payload: string }> = {
        jobId: e.data.jobId,
        payload: 'HELLO FROM FIRST',
      };

      self.postMessage(message);
    });

    const swarm = new WorkerSwarm(() => new Worker(workerUrl), 5);

    expect(swarm.workerPool.length).to.equal(5);
  });

  it('should respond with a message from a single worker', (done) => {
    const workerUrl = createWorkerUrl((e: MessageEvent<WorkerRequest>) => {
      const message: WorkerResponse<{ payload: string }> = {
        jobId: e.data.jobId,
        payload: 'HELLO FROM FIRST',
      };

      self.postMessage(message);
    });

    const swarm = new WorkerSwarm<{}, { payload: string }>(() => new Worker(workerUrl), 1);

    swarm.post({}).then((res) => {
      expect(res.data.payload).to.equal('HELLO FROM FIRST');

      done();
    });
  });

  it('should increase a worker nodes load when initialized', () => {
    const workerUrl = createWorkerUrl(() => {});

    const swarm = new WorkerSwarm<{}, { payload: string }>(() => new Worker(workerUrl), 1);

    swarm.post({});
    swarm.post({});
    swarm.post({});

    expect(swarm.workerPool[0].load).to.equal(3);
  });

  it('should distribute work evenly and send new jobs to the node with the lowest load', () => {
    const workerUrl = createWorkerUrl(() => {});

    const swarm = new WorkerSwarm(() => new Worker(workerUrl), 3);

    swarm.post({});
    swarm.post({});
    swarm.post({});

    expect(swarm.workerPool.map((node) => node.load)).to.deep.equal([1, 1, 1]);

    swarm.post({});
    swarm.post({});

    expect(swarm.workerPool.map((node) => node.load)).to.deep.equal([2, 1, 2]);
  });

  it('should decrease a worker nodes load when it completes', (done) => {
    const workerUrl = createWorkerUrl((e: MessageEvent) => {
      self.postMessage({ jobId: e.data.jobId });
    });

    const swarm = new WorkerSwarm(() => new Worker(workerUrl), 1);

    Promise.all([swarm.post({}), swarm.post({}), swarm.post({})]).then(() => {
      expect(swarm.workerPool[0].load).to.equal(0);

      done();
    });
  });
});

function createWorkerUrl(fn: Function) {
  var blob = new Blob(['self.onmessage = ', fn.toString()], { type: 'text/javascript' });

  return URL.createObjectURL(blob);
}
