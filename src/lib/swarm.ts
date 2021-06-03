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
  workerPool: WorkerNode[] = [];

  constructor(factory: () => Worker, count = 2) {
    for (let i = 0; i < count; i++) {
      this.workerPool.push({ worker: factory(), load: 0 });
    }
  }

  post<T>(data: WorkerMessage<T>) {
    const workerNode = this.workerPool.sort((a, b) => a.load - b.load)[0];

    workerNode.load++;

    return this.run(workerNode.worker, data).then((res) => {
      workerNode.load--; //decrease load when work is done

      return res;
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
