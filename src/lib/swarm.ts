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
  jobId?: number | string;
}

let jobId = 0;

export class WorkerSwarm {
  workerPool = new Map<string, WorkerNode[]>();

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

    return workerNodes.map((workerNode) => {
      workerNode.load++;

      return this.run(workerNode.worker, data).then((res) => {
        workerNode.load--; //decrease load

        return res;
      });
    });
  }

  run<T>(worker: Worker, message: WorkerMessage<T>) {
    const jobMessage: WorkerMessage<T> = { ...message, jobId: message.jobId || jobId++ };

    worker.postMessage(jobMessage);

    return new Promise<MessageEvent>((resolve, reject) => {
      const callback = (e: MessageEvent) => {
        if (e.data.jobId === jobMessage.jobId) {
          worker.removeEventListener('message', callback);

          resolve(e);
        }
      };

      worker.addEventListener('message', callback);

      worker.onerror = reject;
    });
  }
}
