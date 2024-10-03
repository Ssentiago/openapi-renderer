import OpenAPIPreviewController from 'view/OpenAPI/components/preview/controllers/preview-controller';

import { RESOURCE_NAME } from '../../../../typing/constants';

export class ThemeController {
    constructor(public controller: OpenAPIPreviewController) {}

    initializeTheme(): void {
        if (this.controller.preview.plugin.settings.syncOpenAPIPreviewTheme) {
            this.toggleThemeFollowObsidian();
        } else {
            const { settings } = this.controller.preview.plugin;
            this.controller.preview.currentThemeMode =
                settings.OpenAPIPreviewTheme;
            this.controller.preview.currentThemeCSS =
                this.getPreviewCurrentThemeByMode(settings.OpenAPIPreviewTheme);
        }
    }

    isObsidianDarkTheme(): boolean {
        const body = document.querySelector('body');
        return !!body?.classList.contains('theme-dark');
    }

    async requestPreviewThemeChange(): Promise<void> {
        await this.controller.renderManager.rerender();
    }

    toggleThemeFollowObsidian(): void {
        const currentMode = this.isObsidianDarkTheme() ? 'dark' : 'light';
        this.controller.preview.currentThemeMode = currentMode;
        const theme = this.getPreviewCurrentThemeByMode(currentMode);
        this.controller.preview.currentThemeMode = currentMode;
        this.controller.preview.currentThemeCSS = theme;
    }

    getThemeButtonIcon(): 'moon' | 'sun' {
        return this.controller.preview.currentThemeMode === 'dark'
            ? 'moon'
            : 'sun';
    }

    toggleThemeManually(): void {
        this.controller.preview.currentThemeMode =
            this.controller.preview.currentThemeMode === 'dark'
                ? 'light'
                : 'dark';
        this.controller.preview.currentThemeCSS =
            this.getPreviewCurrentThemeByMode(
                this.controller.preview.currentThemeMode
            );
    }

    async syncWithObsidian(): Promise<void> {
        this.toggleThemeFollowObsidian();
        await this.requestPreviewThemeChange();
    }

    getPreviewCurrentThemeByMode(mode: string): RESOURCE_NAME {
        switch (mode) {
            case 'dark':
                return RESOURCE_NAME.DarkThemeCSS;
            case 'light':
                return RESOURCE_NAME.LightThemeCSS;
            default:
                throw new Error(`Unsupported mode: ${mode}`);
        }
    }
}
