import { ApiRefOptions, ApiRefResolution } from '@apiture/api-ref-resolver';
import { ApiRefResolver } from '@apiture/api-ref-resolver/lib/src/ApiRefResolver';
import yaml from 'js-yaml';
import { Notice, setIcon } from 'obsidian';
import path from 'path';
import OpenAPIPreviewController from 'view/OpenAPI/components/preview/controllers/preview-controller';
import { eventID } from '../../../../../events-management/typing/constants';
import {
    EditorChangedEvent,
    SwitchModeStateEvent,
} from '../../../../../events-management/typing/interfaces';

export class PreviewUtils {
    constructor(private controller: OpenAPIPreviewController) {}

    async loadSpec(): Promise<object | null> {
        const file = this.controller.preview.openAPIView.file;
        if (!file) {
            return null;
        }

        const relativePath = file.path;
        const basePath =
            this.controller.preview.plugin.app.vault.adapter.basePath;

        const resolver = new ApiRefResolver(path.join(basePath, relativePath));
        const options: ApiRefOptions = {
            verbose: false,
            conflictStrategy: 'rename',
        };
        let out: ApiRefResolution;
        try {
            out = await resolver.resolve(options);
        } catch (err: any) {
            new Notice(
                'Oops... Something went wrong while resolving $refs. Please ensure your spec file is valid and check the logs for more details.',
                10000
            );
            this.controller.preview.plugin.logger.error(err.message);
            return null;
        }
        return out.api as object;
    }

    convertData(data: string, extension: string): Record<string, any> {
        switch (extension) {
            case 'yaml':
            case 'yml':
                return yaml.load(data) as Record<string, any>;
            case 'json':
                return JSON.parse(data) as Record<string, any>;
            default:
                throw new Error(`Unsupported file extension: ${extension}`);
        }
    }

    initializeActions(): void {
        const { plugin } = this.controller.preview.openAPIView;
        const view = this.controller.preview.openAPIView;

        const themeButton = view.addAction(
            this.controller.themeManager.getThemeButtonIcon(),
            'Theme',
            async () => {
                this.controller.themeManager.toggleThemeManually();
                await this.controller.themeManager.requestPreviewThemeChange();
                setIcon(
                    themeButton,
                    this.controller.themeManager.getThemeButtonIcon()
                );
            }
        );
        plugin.observer.subscribe(
            plugin.app.workspace,
            eventID.PreviewThemeState,
            async () => {
                setIcon(
                    themeButton,
                    this.controller.themeManager.getThemeButtonIcon()
                );
            }
        );
        plugin.observer.subscribe(
            plugin.app.workspace,
            eventID.SwitchModeState,
            async (event: SwitchModeStateEvent) => {
                const leaf = event.data.leaf;
                if (leaf === this.controller.preview.openAPIView.leaf) {
                    themeButton.remove();
                }
            }
        );
    }

    setupEventListeners(): void {
        const { plugin } = this.controller.preview.openAPIView;
        plugin.observer.subscribe(
            plugin.app.workspace,
            eventID.EditorChanged,
            async (event: EditorChangedEvent) => {
                const leaf = event.data.leaf;
                if (this.controller.preview.openAPIView.leaf === leaf) {
                    if (
                        this.controller.preview.openAPIView.mode === 'preview'
                    ) {
                        await this.controller.render();
                    }
                }
            }
        );

        this.controller.preview.plugin.app.workspace.on(
            'css-change',
            async () => {
                if (
                    this.controller.preview.plugin.settings
                        .syncOpenAPIPreviewTheme
                ) {
                    await this.controller.themeManager.syncWithObsidian();
                }
            }
        );

        plugin.observer.subscribe(
            plugin.app.workspace,
            eventID.PreviewThemeState,
            async () => {
                if (plugin.settings.syncOpenAPIPreviewTheme) {
                    await this.controller.themeManager.syncWithObsidian();
                } else {
                    const mode = plugin.settings.OpenAPIPreviewTheme;
                    this.controller.preview.currentThemeMode = mode;
                    this.controller.preview.currentThemeCSS =
                        this.controller.themeManager.getPreviewCurrentThemeByMode(
                            mode
                        );
                    await this.controller.renderManager.rerender();
                }
            }
        );
    }
}
