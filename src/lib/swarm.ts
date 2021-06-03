export interface WorkerNode {
  worker: Worker;
  load: number;
}

export type JobId = string | number;

export type WorkerRequest<T = object> = { jobId: JobId } & T;
export type WorkerResponse<T = object> = { jobId: JobId } & T;

let jobId = 0;

export class WorkerSwarm<T extends object = {}, R extends object = {}> {
  workerPool: WorkerNode[] = [];

  constructor(factory: () => Worker, count = 2) {
    for (let i = 0; i < count; i++) {
      this.workerPool.push({ worker: factory(), load: 0 });
    }
  }

  post(data: T) {
    const workerNode = this.workerPool.sort((a, b) => a.load - b.load)[0];

    workerNode.load++;

    return this.run(workerNode.worker, data).then((res) => {
      workerNode.load--; //decrease load when work is done

      return res;
    });
  }

  run(worker: Worker, data: T) {
    const currentJobId = jobId++;

    worker.postMessage({ ...data, jobId: currentJobId });

    return new Promise<MessageEvent<WorkerResponse<R>>>((resolve, reject) => {
      const callback = (e: MessageEvent<WorkerResponse<R>>) => {
        if (e.data.jobId === currentJobId) {
          worker.removeEventListener('message', callback);

          resolve(e);
        }
      };

      worker.addEventListener('message', callback);

      worker.onerror = reject;
    });
  }
}
