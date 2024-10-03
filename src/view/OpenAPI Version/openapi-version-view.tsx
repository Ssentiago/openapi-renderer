import { IconName, TextFileView, TFile, WorkspaceLeaf } from 'obsidian';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import OpenAPIRendererPlugin from '../../core/openapi-renderer-plugin';
import { Specification } from '../../indexedDB/database/specification';
import { OPENAPI_VERSION_VIEW_TYPE } from '../typing/types';
import { VersionViewEntry } from './components/entry-component';
import { VersionController } from './controllers/version-controller';

export class OpenAPIVersionView extends TextFileView {
    versions!: Array<Specification>;
    controller: VersionController;
    reactRoot!: Root | undefined;
    plugin: OpenAPIRendererPlugin;

    constructor(leaf: WorkspaceLeaf, plugin: OpenAPIRendererPlugin) {
        super(leaf);
        this.plugin = plugin;

        this.controller = new VersionController(this);
    }

    getViewType(): string {
        return OPENAPI_VERSION_VIEW_TYPE;
    }

    getDisplayText(): string {
        if (this.file) {
            return `OpenAPI Version View: ${this.file.name}`;
        }
        return 'No file open';
    }

    async onLoadFile(file: TFile): Promise<void> {
        await super.onLoadFile(file);

        const { contentEl } = this;

        if (!this.file) {
            contentEl.createDiv({ text: 'No file open' });
            return;
        }

        const spec = await this.controller.getVersionHistory();
        if (!spec) {
            return;
        }
        this.versions = spec;

        contentEl.empty();

        const reactRootElement = contentEl.createDiv();

        this.reactRoot = createRoot(reactRootElement);
        this.reactRoot.render(
            <VersionViewEntry specifications={this.versions} view={this} />
        );
    }

    async onClose(): Promise<void> {
        if (this.reactRoot) {
            this.reactRoot.unmount();
        }
        this.controller.workerHelper.terminateWorker();
    }

    clear(): void {
        this.data = '';
    }

    getViewData(): string {
        return this.data;
    }

    setViewData(data: string, clear: boolean): void {
        this.data = data;
    }

    getIcon(): IconName {
        return 'file-clock';
    }
}
