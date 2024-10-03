import { Specification } from '../../../indexedDB/database/specification';
import { OpenAPIVersionView } from '../openapi-version-view';
import {
    MessageType,
    ResponseType,
    SpecParams,
} from '../../../indexedDB/typing/interfaces';

import { WorkerHelper } from '../../../indexedDB/worker/helper';
import { ThemeController } from './theme-controller';
import { VersionUtils } from './versionUtils';
import jsyaml from 'js-yaml';
import { DiffController } from './diff-controller';
import pako from 'pako';

export class VersionController {
    workerHelper: WorkerHelper;
    themeController: ThemeController;
    versionUtils: VersionUtils;
    diffController: DiffController;

    constructor(public versionView: OpenAPIVersionView) {
        this.workerHelper = new WorkerHelper();
        this.themeController = new ThemeController(this);
        this.versionUtils = new VersionUtils(this);
        this.diffController = new DiffController();

        this.initializeActions();
    }

    async getVersionHistory(): Promise<Array<Specification> | [] | undefined> {
        const path = this.versionView.file?.path;
        if (!path) {
            return;
        }
        const response = await this.workerHelper.sendMessage({
            type: MessageType.GetVersions,
            payload: {
                data: { path: path },
            },
        });
        let specs: Array<SpecParams> | Array<Specification> =
            response.payload.data;
        if (response.type === ResponseType.Success && specs.length > 0) {
            specs = specs.map((spec) => new Specification(spec));
            return specs as Array<Specification>;
        }
        return [];
    }

    async deleteVersion(id: number): Promise<boolean> {
        const response = await this.workerHelper.sendMessage({
            type: MessageType.DeleteVersion,
            payload: { data: { id: id } },
        });

        return response.type === 'SUCCESS';
    }

    async restoreVersion(id: number): Promise<boolean> {
        const response = await this.workerHelper.sendMessage({
            type: MessageType.RestoreVersion,
            payload: { data: { id: id } },
        });

        return response.type === 'SUCCESS';
    }

    async deleteVersionPermanently(id: number): Promise<boolean> {
        const response = await this.workerHelper.sendMessage({
            type: MessageType.DeletePermanently,
            payload: { data: { id: id } },
        });

        if (response.type === 'SUCCESS') {
            this.versionView.versions = this.versionView.versions.filter(
                (viewSpec) => viewSpec.id !== id
            );
        }
        return response.type === 'SUCCESS';
    }

    async saveVersion(formData: {
        specName: string;
        specVersion: string;
    }): Promise<boolean> {
        const view = this.versionView;
        const file = view.file;
        if (!file) {
            return false;
        }
        let diff: string;
        let currentViewData: string;
        const name = formData.specName;
        const version = formData.specVersion;

        switch (this.versionView.file?.extension) {
            case 'yaml':
            case 'yml':
                currentViewData = JSON.stringify(
                    jsyaml.load(this.versionView.data)
                );
                break;
            case 'json':
                currentViewData = this.versionView.data;
                break;
            default:
                throw new Error();
        }

        let isFull = false;
        if (!view.versions || view.versions.length === 0) {
            isFull = true;
            diff = currentViewData;
        } else {
            const lastVersion = view.versions.last();
            const old = JSON.parse(
                lastVersion!.getPatchedVersion(view.versions).diff as string
            );
            const _new = JSON.parse(currentViewData);

            diff = JSON.stringify(this.diffController.diff(old, _new));
            if (!diff) {
                this.versionView.plugin.logger.error(
                    'No new changes found between previous and current draft version'
                );
                return false;
            }

            const shouldBeFull = await this.workerHelper.sendMessage({
                type: MessageType.IsNextVersionFull,
                payload: { data: { path: file.path } },
            });
            if (shouldBeFull.type === 'SUCCESS') {
                isFull =
                    shouldBeFull.payload.data ||
                    this.versionUtils.isLargeChange(JSON.parse(diff));
            }
        }

        const gzippedDiff = pako.gzip(diff);

        const spec = {
            path: file.path,
            name: name,
            diff: gzippedDiff,
            version: version,
            createdAt: new Date().toString(),
            softDeleted: false,
            isFull: isFull,
        };
        try {
            const result = await this.workerHelper.sendMessage({
                type: MessageType.AddVersion,
                payload: { data: { spec: spec } },
            });
            if (result.type === 'SUCCESS') {
                const lastVersion = await this.workerHelper.sendMessage({
                    type: MessageType.GetLastVersion,
                    payload: {
                        data: { path: file.path },
                    },
                });
                if (lastVersion.type === ResponseType.Success) {
                    let spec = lastVersion.payload.data;
                    spec = new Specification(spec);
                    this.versionView.versions.push(spec);
                }
                return true;
            }
            this.versionView.plugin.logger.error(result.payload.data.message);
            return false;
        } catch (error: any) {
            this.versionView.plugin.logger.error(error.message);
            return false;
        }
    }

    initializeActions(): void {
        this.versionView.addAction(
            'download',
            'Export all versions of this file as a ZIP archive',
            async () => {
                await this.versionView.plugin.export.export(
                    this.versionView.versions
                );
                this.versionView.plugin.showNotice('Exported successfully');
            }
        );
    }
}
