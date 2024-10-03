import { Compartment, Extension } from '@codemirror/state';

import { RenderingMode } from '../../../../typing/constants';
import { themes } from '../extensions/themes';
import { SourceController } from './source-controller';

export class ThemeController {
    themeConfigurator: Compartment = new Compartment();

    constructor(private controller: SourceController) {}

    getEditorCurrentThemeByMode(
        mode: string
    ): { extension: Extension } | readonly Extension[] | undefined {
        const { settings } = this.controller.editor.plugin;
        return themes
            .get(mode)
            ?.get(
                mode === 'dark'
                    ? settings.OpenAPISourceDarkTheme
                    : settings.OpenAPISourceLightTheme
            );
    }

    initializeTheme(): void {
        if (this.controller.editor.plugin.settings.syncOpenAPISourceTheme) {
            this.toggleThemeFollowObsidian();
        } else {
            const { settings } = this.controller.editor.plugin;
            this.controller.editor.currentThemeMode =
                settings.OpenAPISourceThemeMode;
            const theme = this.getEditorCurrentThemeByMode(
                settings.OpenAPISourceThemeMode
            );
            if (theme) {
                this.controller.editor.currentTheme = theme;
            }
        }
    }

    isObsidianDarkTheme(): boolean {
        const body = document.querySelector('body');
        return !!body?.classList.contains('theme-dark');
    }

    requestSourceThemeChange(): void {
        if (this.controller.editor.view.mode === RenderingMode.Source) {
            this.controller.editor.editor.dispatch({
                effects: this.themeConfigurator.reconfigure(
                    this.controller.editor.currentTheme
                ),
            });
        }
    }

    getThemeButtonIcon(): 'moon' | 'sun' {
        return this.controller.editor.currentThemeMode === 'dark'
            ? 'moon'
            : 'sun';
    }

    toggleThemeFollowObsidian(): void {
        const currentMode = this.isObsidianDarkTheme() ? 'dark' : 'light';
        this.controller.editor.currentThemeMode = currentMode;
        const theme = this.getEditorCurrentThemeByMode(currentMode);
        if (theme) {
            this.controller.editor.currentThemeMode = currentMode;
            this.controller.editor.currentTheme = theme;
        }
    }

    toggleThemeManually(): void {
        this.controller.editor.currentThemeMode =
            this.controller.editor.currentThemeMode === 'dark'
                ? 'light'
                : 'dark';
        const theme = this.getEditorCurrentThemeByMode(
            this.controller.editor.currentThemeMode
        );
        if (theme) {
            this.controller.editor.currentTheme = theme;
        }
    }

    syncWithObsidian(): void {
        this.toggleThemeFollowObsidian();
        this.requestSourceThemeChange();
    }
}
