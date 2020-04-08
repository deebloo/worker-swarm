# Worker Swarm

A small library to help distribute work across a pool of workers

```TS
import { WorkerSwarm } from 'worker-swarm';

const swarm = new WorkerSwarm([
    // Multiple instances of the same worker.
    // Work will be distributed to the worker with the fewest active jobs
    {
        name: 'first',
        workers: [
          new Worker('./first.worker.js'),
          new Worker('./first.worker.js'),
          new Worker('./first.worker.js'),
          new Worker('./first.worker.js'),
        ],
        handles: ['TEST'],
    },
    // Worker definitions state which post types a worker is able to handle
    {
        name: 'second',
        workers: [new Worker('./second.worker.js')],
        handles: ['FOO'],
    },
]);

swarm.post({ type: 'TEST' }).then((res) => {
    console.log(res)
});
```
