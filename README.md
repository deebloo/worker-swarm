# Worker Swarm

A small library to help distribute work across a pool of workers

```
npm i worker-swarm
```

### first.worker.js

```TS
self.onmessage = (e) => {
  self.postMessage({
    jobId: e.data.jobId,
    message: 'RESPONSE FROM ANOTHER THREAD'
  })
}
```

### UI Thread

```TS
import { WorkerSwarm } from 'worker-swarm';

const swarm = new WorkerSwarm([
    // Multiple instances of the same worker.
    // Work will be distributed to the worker with the fewest active jobs
    {
        name: 'first',
        workers: new Array(4).fill(new Worker('./first.worker.js'))
        handles: ['TEST'],
    },
    // Worker definitions state which post types a worker is able to handle
    {
        name: 'second',
        workers: [new Worker('./second.worker.js')],
        handles: ['FOO'],
    },
]);

Promise.all(swarm.post({ type: 'TEST' })).then((res) => {
    console.log(res)
});
```
