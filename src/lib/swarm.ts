export interface WorkerNode {
  worker: Worker;
  load: number;
}

export interface WorkerSendMessage<T = any> {
  type: string;
  payload?: T;
  jobId?: number | string;
}

export interface WorkerReceiveMessage<T = any> {
  type: string;
  payload?: T;
  jobId: number | string;
}

export interface WorkerResponse<T = any> {
  payload?: T;
  jobId: number | string;
}

let jobId = 0;

export class WorkerSwarm<T, R> {
  workerPool: WorkerNode[] = [];

  constructor(factory: () => Worker, count = 2) {
    for (let i = 0; i < count; i++) {
      this.workerPool.push({ worker: factory(), load: 0 });
    }
  }

  post(data: WorkerSendMessage<T>) {
    const workerNode = this.workerPool.sort((a, b) => a.load - b.load)[0];

    workerNode.load++;

    return this.run(workerNode.worker, data).then((res) => {
      workerNode.load--; //decrease load when work is done

      return res;
    });
  }

  run(worker: Worker, message: WorkerSendMessage<T>) {
    const jobMessage: WorkerSendMessage<T> = { ...message, jobId: message.jobId || jobId++ };

    worker.postMessage(jobMessage);

    return new Promise<MessageEvent<WorkerResponse<R>>>((resolve, reject) => {
      const callback = (e: MessageEvent<WorkerResponse<R>>) => {
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
