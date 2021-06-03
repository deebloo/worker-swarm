# Worker Swarm

A small library to help distribute work across a pool of workers

```
npm i worker-swarm
```

### worker.js

```TS
self.onmessage = (e) => {
  self.postMessage({
    jobId: e.data.jobId, // send the job id back to complete a task
    message: 'RESPONSE FROM ANOTHER THREAD'
  })
}
```

### UI Thread

```TS
import { WorkerSwarm } from 'worker-swarm';

// Create 3 instances of the worker
const swarm = new WorkerSwarm(() => new Worker('./worker.js'), 3);

// Will go to first worker
swarm.post({ type: 'TEST' }).then((res) => {
    console.log(res)
});

// Will go to the second worker
swarm.post({ type: 'TEST' }).then((res) => {
    console.log(res)
});

// Will go to the third worker
swarm.post({ type: 'TEST' }).then((res) => {
    console.log(res)
});
```
