import OpenAPIRendererPlugin from 'core/openapi-renderer-plugin';
import OpenAPIPreviewController from 'view/OpenAPI/components/preview/controllers/preview-controller';
import { OpenAPIView } from 'view/OpenAPI/OpenAPI-view';
import { RESOURCE_NAME } from '../../../typing/constants';
import { IOpenAPIViewComponent } from '../../../typing/interfaces';

export default class OpenAPIPreview implements IOpenAPIViewComponent {
    renderTimeout: NodeJS.Timeout | null = null;
    currentThemeMode!: string;
    currentThemeCSS!: RESOURCE_NAME;
    controller: OpenAPIPreviewController;

    constructor(
        public openAPIView: OpenAPIView,
        public plugin: OpenAPIRendererPlugin,
        public contentEl: HTMLDivElement
    ) {
        this.controller = new OpenAPIPreviewController(this);
    }

    async render(): Promise<void> {
        await this.controller.initializePreview();
        await this.controller.render();
    }

    hide(): void {
        this.contentEl.hide();
    }

    clear(): void {
        this.contentEl.empty();
    }

    close(): void {
        this.clear();
    }

    getComponentData(): string {
        return this.openAPIView.data;
    }
}
