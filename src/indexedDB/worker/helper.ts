import Worker from 'web-worker:./db-worker.ts';
import { WorkerMessage, WorkerResponse } from '../typing/interfaces';

export class WorkerHelper {
    private worker: Worker;
    private messageID = 0;
    private pendingMessages: Map<
        number,
        {
            resolve: (response: WorkerResponse) => void;
            reject: (error: any) => void;
        }
    > = new Map();

    constructor() {
        this.worker = new Worker();
        this.worker.onmessage = (event: MessageEvent<WorkerResponse>): void => {
            const id = event.data.id as number;
            const pending = this.pendingMessages.get(id);
            if (pending) {
                pending.resolve(event.data);
                this.pendingMessages.delete(id);
            }
        };

        this.worker.onerror = (error): void => {};
    }

    sendMessage(message: WorkerMessage): Promise<WorkerResponse> {
        return new Promise((resolve, reject) => {
            const id = this.messageID++;
            this.pendingMessages.set(id, { resolve, reject });
            this.worker.postMessage({ ...message, id });
        });
    }

    terminateWorker(): void {
        this.pendingMessages.forEach(({ reject }) => {
            reject(new Error('This worker was terminated forcibly'));
        });

        this.pendingMessages.clear();

        this.worker.terminate();
        this.worker = null as any;
    }
}
