export class WorkerSwarm {
  workerDefs = [];

  workerPool = new Map();

  availableWorkers = [];

  constructor(workerDefs) {
    this.workerDefs = workerDefs;

    for (workerDef of this.workerDefs) {
      for (let i = 0; i < workerDef.scale; i++) {
        this.workerPool.set(`${workerDef.name}_${i + 1}`, {
          worker: new Worker(workerDef.path),
          isBusy: false,
        });
      }
    }

    console.log(this.workerPool);
  }

  post(data) {
    const workerDefs = this.workerDefs.filter((workerDef) =>
      workerDef.handles.includes(data.type)
    );

    workerDefs.forEach((worker) => {
      console.log(`Running worker "${worker.id}" with payload:`, data);
    });

    return Promise.all(
      this.workerDefs
        .filter((workerDef) => workerDef.handles.includes(data.type))
        .map((workerDef) => this.run(workerDef.worker, data))
    );
  }

  run(worker, data) {
    worker.postMessage(data);

    return new Promise(function (resolve, reject) {
      worker.onmessage = resolve;
      worker.onerror = reject;
    });
  }
}
