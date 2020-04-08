export interface WorkerDef {
  name: string;
  workers: Worker[];
  handles: string[];
}

export interface WorkerNode {
  worker: Worker;
  load: number;
}

export interface WorkerMessage<T> {
  type: string;
  payload?: T;
}

export class WorkerSwarm {
  private workerPool = new Map<string, WorkerNode[]>();

  constructor(private workerDefs: WorkerDef[]) {
    workerDefs.forEach((workerDef) => {
      this.workerPool.set(
        workerDef.name,
        workerDef.workers.map((worker) => ({ worker, load: 0 }))
      );
    });
  }

  post<T>(data: WorkerMessage<T>) {
    // Get workers that can handle the given message type
    const workerDefs = this.workerDefs.filter((workerDef) => workerDef.handles.includes(data.type));

    // Get the Worker Nodes from the available worker defs
    const workerNodes: WorkerNode[] = workerDefs.map((workerDef) => {
      const workerNodes = this.workerPool.get(workerDef.name) as WorkerNode[];

      // select the node with the lowest node
      const workerNode = workerNodes.sort((a, b) => a.load - b.load)[0];

      return workerNode;
    });

    return Promise.all(
      workerNodes.map((workerNode) => {
        workerNode.load++;

        return this.run(workerNode.worker, data).then((res) => {
          workerNode.load--; //decrease load

          return res;
        });
      })
    );
  }

  run<T>(worker: Worker, data: T) {
    worker.postMessage(data);

    return new Promise<MessageEvent>(function (resolve, reject) {
      worker.onmessage = resolve;
      worker.onerror = reject;
    });
  }
}
