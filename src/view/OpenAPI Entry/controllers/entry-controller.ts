import { WorkerHelper } from 'indexedDB/worker/helper';
import {
    EntryViewData,
    MessageType,
    ResponseType,
    SpecParams,
} from 'indexedDB/typing/interfaces';
import { Specification } from '../../../indexedDB/database/specification';

import { OpenAPIEntryView } from '../OpenAPI-entry-view';

export class EntryController {
    helper: WorkerHelper;

    constructor(public view: OpenAPIEntryView) {
        this.helper = new WorkerHelper();
        this.initializeActions();
    }

    async getEntryViewData(): Promise<EntryViewData> {
        const response = await this.helper.sendMessage({
            type: MessageType.GetEntryViewData,
            payload: { data: null },
        });
        if (response.type === ResponseType.Success) {
            return response.payload.data as EntryViewData;
        }
        return {};
    }

    async deleteFile(path: string): Promise<boolean> {
        const response = await this.helper.sendMessage({
            type: MessageType.DeleteFile,
            payload: {
                data: {
                    path: path,
                },
            },
        });
        return response.type === 'SUCCESS';
    }

    /**
     * Retrieves all versions of a file from the helper.
     *
     * @param {string} path - The path of the file to retrieve versions for.
     * @return {Array<Specification>} An array of specifications representing the file versions.
     */
    async getAllVersionsForFile(path: string): Promise<Specification[] | null> {
        const response = await this.helper.sendMessage({
            type: MessageType.GetVersions,
            payload: {
                data: {
                    path: path,
                },
            },
        });
        if (response.type === 'SUCCESS') {
            const specs = response.payload.data as Array<SpecParams>;
            return specs.map((spec) => new Specification(spec));
        }
        return null;
    }

    /**
     * Retrieves all export data from the helper and returns it as a record of specifications.
     *
     * @return {Record<string, Specification[]> | undefined} A record of specifications where each key is a path and each value is an array of specifications.
     */
    async getAllExportData(): Promise<
        Record<string, Specification[]> | undefined
    > {
        const response = await this.helper.sendMessage({
            type: MessageType.GetAllData,
            payload: {
                data: null,
            },
        });
        if (response.type === 'SUCCESS') {
            const specs = response.payload.data as Array<SpecParams>;
            return specs.reduce<Record<string, Specification[]>>(
                (acc, spec) => {
                    if (!acc[spec.path]) {
                        acc[spec.path] = [];
                    }
                    acc[spec.path].push(new Specification(spec));
                    return acc;
                },
                {}
            );
        }
    }

    /**
     * Initializes the actions for the view.
     *
     * Adds a 'download' action to the view, which exports all saved data when triggered.
     *
     * @return {void}
     */
    initializeActions(): void {
        this.view.addAction(
            'download',
            'Export all versions of all tracked files as a ZIP archive',
            async () => {
                const allData = await this.getAllExportData();
                if (allData) {
                    await this.view.plugin.export.export(allData);
                    this.view.plugin.showNotice('Exported successfully');
                }
            }
        );
    }
}
