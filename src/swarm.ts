import { Router } from "./router";

export interface WorkerDef {
  name: string;
  path: string;
  handles: string[];
  scale?: number;
}

export interface WorkerNode {
  worker: Worker;
  jobs: number;
}

export interface WorkerMessage<T> {
  type: string;
  payload?: T;
}

export class WorkerSwarm {
  private workerPool = new Map<string, WorkerNode[]>();

  constructor(private workerDefs: WorkerDef[]) {
    workerDefs.forEach((workerDef) => {
      if (!this.workerPool.has(workerDef.name)) {
        this.workerPool.set(workerDef.name, [
          { worker: new Worker(workerDef.path), jobs: 0 },
        ]);
      } else {
        this.workerPool.set(workerDef.name, [
          ...(this.workerPool.get(workerDef.name) as WorkerNode[]),
          { worker: new Worker(workerDef.path), jobs: 0 },
        ]);
      }
    });
  }

  post<T>(data: WorkerMessage<T>) {
    // Get workers that can handle the given message type
    const workerDefs = this.workerDefs.filter((workerDef) =>
      workerDef.handles.includes(data.type)
    );

    const workers: Worker[] = [];

    workerDefs.forEach((workerDef) => {
      const workers = this.workerPool.get(workerDef.name) as WorkerNode[];

      workers.forEach((worker) => {
        workers.push(worker);
      });
    });

    return Promise.all(workers.map((worker) => this.run(worker, data)));
  }

  run<T>(worker: Worker, data: T) {
    worker.postMessage(data);

    return new Promise(function (resolve, reject) {
      worker.onmessage = resolve;
      worker.onerror = reject;
    });
  }
}
