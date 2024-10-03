import { IndexedDB } from '../database/indexedDB';
import { BaseSpecification } from '../database/specification';
import { MessageType, ResponseType, WorkerMessage } from '../typing/interfaces';

const db = new IndexedDB();

self.onmessage = async (event: MessageEvent<WorkerMessage>): Promise<void> => {
    const { type, payload } = event.data;
    const messageID = event.data.id as number;
    try {
        let id: number;
        switch (type) {
            case MessageType.AddVersion:
                const spec = new BaseSpecification(payload.data.spec);
                await db.add(spec);
                self.postMessage({
                    id: messageID,
                    type: ResponseType.Success,
                });

                break;
            case MessageType.GetVersions:
                const path = payload.data.path;
                if (!path) {
                    return;
                }
                const versions = await db.getVersions(path);
                self.postMessage({
                    id: messageID,
                    type: ResponseType.Success,
                    payload: { data: versions },
                });
                break;
            case MessageType.GetLastVersion:
                const lastVersion = await db.getLastVersion(payload.data.path);
                self.postMessage({
                    id: messageID,
                    type: ResponseType.Success,
                    payload: { data: lastVersion },
                });
                break;
            case MessageType.DeleteVersion:
                id = parseInt(payload.data.id, 10);
                await db.deleteVersion(id);
                self.postMessage({
                    id: messageID,
                    type: ResponseType.Success,
                    payload: null,
                });
                break;
            case MessageType.RestoreVersion:
                id = parseInt(payload.data.id, 10);
                await db.restoreVersion(id);
                self.postMessage({
                    id: messageID,
                    type: ResponseType.Success,
                    payload: null,
                });
                break;
            case MessageType.DeletePermanently:
                id = parseInt(payload.data.id, 10);
                await db.deleteVersionPermanently(id);
                self.postMessage({
                    id: messageID,
                    type: ResponseType.Success,
                    payload: null,
                });
                break;
            case MessageType.IsNextVersionFull:
                const fPath = payload.data.path;
                const isNextVersionFull = await db.isNextVersionFull(fPath);
                self.postMessage({
                    id: messageID,
                    type: ResponseType.Success,
                    payload: { data: isNextVersionFull },
                });
                break;
            case MessageType.GetEntryViewData:
                const data = await db.getEntryViewData();
                self.postMessage({
                    id: messageID,
                    type: ResponseType.Success,
                    payload: { data: data },
                });
                break;
            case MessageType.GetAllData:
                const allData = await db.getAllData();
                self.postMessage({
                    id: messageID,
                    type: ResponseType.Success,
                    payload: { data: allData },
                });

                break;
            case MessageType.IsFileTracked:
                const filePath = payload.data.path;
                const isFileTracked = await db.isFileTracked(filePath);
                self.postMessage({
                    id: messageID,
                    type: ResponseType.Success,
                    payload: { data: isFileTracked },
                });
                break;
            case MessageType.RenameFile:
                const { oldPath, newPath } = payload.data;
                await db.renameFile(oldPath, newPath);
                self.postMessage({
                    id: messageID,
                    type: ResponseType.Success,
                    payload: null,
                });
                break;
            case MessageType.DeleteFile:
                const { path: deletePath } = payload.data;
                await db.deleteFile(deletePath);
                self.postMessage({
                    id: messageID,
                    type: ResponseType.Success,
                    payload: null,
                });
                break;
            default:
                self.postMessage({
                    id: messageID,
                    type: ResponseType.Error,
                    payload: { message: `Unknown message type: ${type}` },
                });
        }
    } catch (err: any) {
        self.postMessage({
            id: messageID,
            type: ResponseType.Error,
            payload: { data: { message: err.message } },
        });
    }
};
