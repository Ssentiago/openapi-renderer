import OpenAPIRendererPlugin from 'core/openapi-renderer-plugin';
import { IconName, TextFileView, TFile, WorkspaceLeaf } from 'obsidian';
import OpenAPIPreview from 'view/OpenAPI/components/preview/OpenAPI-preview';
import { OpenAPISource } from 'view/OpenAPI/components/source/OpenAPI-source';
import { OpenAPIController } from 'view/OpenAPI/controllers/view-controller';
import { eventID } from '../../events-management/typing/constants';
import { SwitchModeStateEvent } from '../../events-management/typing/interfaces';
import { RenderingMode } from '../typing/constants';
import { IOpenAPIViewComponent } from '../typing/interfaces';
import { OPENAPI_VIEW_TYPE } from '../typing/types';

export class OpenAPIView extends TextFileView {
    controller: OpenAPIController;
    source: OpenAPISource;
    preview: OpenAPIPreview;
    mode: RenderingMode;
    activeComponent!: IOpenAPIViewComponent;
    sourceContainer: HTMLDivElement;
    previewContainer: HTMLDivElement;
    private shadowDom: HTMLDivElement;
    private shadowRoot: ShadowRoot;

    constructor(
        leaf: WorkspaceLeaf,
        public plugin: OpenAPIRendererPlugin
    ) {
        super(leaf);
        this.shadowDom = this.contentEl.createDiv({
            cls: 'fill-height-or-more',
        });
        this.shadowRoot = this.shadowDom.attachShadow({ mode: 'open' });

        const style = document.createElement('style');
        style.textContent = `
          .fill-height-or-more {
            display: flex;
            flex-direction: column;
          }
        
          .fill-height-or-more > div {
            flex: 1;
            display: flex;
            flex-direction: column;
          }
        `;
        this.shadowRoot.appendChild(style);

        this.sourceContainer = document.createElement('div');
        this.sourceContainer.className = 'openapi-renderer-source-container';
        this.shadowRoot.appendChild(this.sourceContainer);

        this.previewContainer = document.createElement('div');
        this.previewContainer.className = 'openapi-renderer-preview-container';
        this.shadowRoot.appendChild(this.previewContainer);

        this.mode = plugin.settings.OpenAPIViewDefaultMode as RenderingMode;
        this.controller = new OpenAPIController(this);
        this.source = new OpenAPISource(this, plugin, this.sourceContainer);
        this.preview = new OpenAPIPreview(this, plugin, this.previewContainer);
        this.initializeComponent();
        this.leaf.setGroup('openapi-renderer-view-group');
    }

    initializeComponent(): void {
        switch (this.mode) {
            case RenderingMode.Source:
                this.activeComponent = this.source;
                break;
            case RenderingMode.Preview:
                this.activeComponent = this.preview;
                break;
            default:
                throw new Error(`Unsupported mode: ${this.mode}`);
        }
    }

    async onOpen(): Promise<void> {
        await super.onOpen();
    }

    async onClose(): Promise<void> {
        this.data = '';
        this.source.close();
        this.preview.close();
    }

    getViewType(): string {
        return OPENAPI_VIEW_TYPE;
    }

    getIcon(): IconName {
        return 'file-code';
    }

    getDisplayText(): string {
        if (this.file) {
            return `OpenAPI View: ${this.file.name}`;
        }
        return 'No file open';
    }

    onSwitch(): void {
        this.data = this.activeComponent.getComponentData();
        this.activeComponent.hide();
        this.mode = this.controller.newMode;
        this.plugin.publisher.publish({
            eventID: eventID.SwitchModeState,
            timestamp: new Date(),
            emitter: this.app.workspace,
            data: {
                leaf: this.leaf,
            },
        } as SwitchModeStateEvent);
        this.initializeComponent();
        this.activeComponent.render();
    }

    async onLoadFile(file: TFile): Promise<void> {
        await super.onLoadFile(file);
        this.activeComponent.render();
    }

    getViewData(): string {
        switch (this.mode) {
            case RenderingMode.Source:
                return this.source.getComponentData();
            case RenderingMode.Preview:
                return this.data;
            default:
                throw new Error(`Unsupported mode: ${this.mode}`);
        }
    }

    setViewData(data: string, clear: boolean): void {
        this.data = data;
        if (clear) {
            this.clear();
        }
    }

    clear(): void {
        this.preview.clear();
        this.source.clear();
        this.plugin.publisher.publish({
            eventID: eventID.SwitchModeState,
            timestamp: new Date(),
            emitter: this.app.workspace,
            data: {
                leaf: this.leaf,
            },
        } as SwitchModeStateEvent);
    }

    async onUnloadFile(file: TFile): Promise<void> {}
}
