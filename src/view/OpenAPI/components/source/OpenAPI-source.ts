import { LanguageSupport } from '@codemirror/language';
import { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import OpenAPIRendererPlugin from 'core/openapi-renderer-plugin';
import { OpenAPIView } from 'view/OpenAPI/OpenAPI-view';
import { IOpenAPIViewComponent } from '../../../typing/interfaces';
import { SourceController } from './controllers/source-controller';

export class OpenAPISource implements IOpenAPIViewComponent {
    editor!: EditorView;
    currentTheme!: Extension;
    currentThemeMode!: string;
    languageExtension!: () => LanguageSupport;
    controller: SourceController;

    constructor(
        public view: OpenAPIView,
        public plugin: OpenAPIRendererPlugin,
        public contentEl: HTMLDivElement
    ) {
        this.controller = new SourceController(this);
    }

    async render(): Promise<void> {
        this.controller.initializeEditor();
    }

    hide(): void {
        this.contentEl.hide();
    }

    clear(): void {
        if (this.editor) {
            this.editor.dispatch({
                changes: {
                    from: 0,
                    to: this.editor.state.doc.toString().length,
                    insert: this.view.data,
                },
            });
        }
    }

    close(): void {
        this.editor?.destroy();
    }

    getComponentData(): string {
        return this.editor.state.doc.toString();
    }
}
