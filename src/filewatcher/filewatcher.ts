import { TAbstractFile } from 'obsidian';
import OpenAPIRendererPlugin from '../core/openapi-renderer-plugin';
import { eventID } from '../events-management/typing/constants';
import { ReloadOpenAPIEntryStateEvent } from '../events-management/typing/interfaces';
import { WorkerHelper } from '../indexedDB/worker/helper';
import { MessageType } from '../indexedDB/typing/interfaces';

export class FileWatcher {
    helper: WorkerHelper;

    constructor(public plugin: OpenAPIRendererPlugin) {
        this.helper = new WorkerHelper();
        this.startWatching();
    }

    /**
     * This method starts watching the file system for file rename events.
     * When a rename event is detected, it checks if the renamed file is tracked
     * by the plugin. If it is, it sends a message to the worker to rename the
     * file in the database and triggers a reload of the openapi entry state.
     */
    startWatching(): void {
        this.plugin.app.vault.on(
            'rename',
            async (file: TAbstractFile, oldPath: string) => {
                const isFileTracked = await this.helper.sendMessage({
                    type: MessageType.IsFileTracked,
                    payload: {
                        data: {
                            path: oldPath,
                        },
                    },
                });
                if (
                    isFileTracked.type === 'SUCCESS' &&
                    isFileTracked.payload.data
                ) {
                    const response = await this.helper.sendMessage({
                        type: MessageType.RenameFile,
                        payload: {
                            data: {
                                oldPath: oldPath,
                                newPath: file.path,
                            },
                        },
                    });
                    if (response.type === 'ERROR') {
                        this.plugin.logger.error(response.payload.data.message);
                        return;
                    }
                    this.plugin.publisher.publish({
                        eventID: eventID.ReloadOpenAPIEntryState,
                        emitter: this.plugin.app.workspace,
                        timestamp: new Date(),
                    } as ReloadOpenAPIEntryStateEvent);
                }
            }
        );
    }
}
