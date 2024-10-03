import path from 'path';
import OpenAPIRendererPlugin from '../core/openapi-renderer-plugin';

export interface DEFAULT_SETTINGS_Interface {
    resourcesAutoUpdate: boolean;
    OpenAPIPreviewTheme: string;
    syncOpenAPIPreviewTheme: boolean;
    OpenAPISourceThemeMode: string;
    OpenAPISourceLightTheme: string;
    OpenAPISourceDarkTheme: string;
    syncOpenAPISourceTheme: boolean;
    OpenAPIViewDefaultMode: string;
    OpenAPIEntryGridLayoutColumns: number;
}

export default class SettingsManager {
    plugin: OpenAPIRendererPlugin;

    constructor(plugin: OpenAPIRendererPlugin) {
        this.plugin = plugin;
    }

    /**
     * Gets the default settings.
     *
     * @returns The default settings.
     */
    get defaultSettings(): DEFAULT_SETTINGS_Interface {
        return {
            resourcesAutoUpdate: false,
            OpenAPIPreviewTheme: 'dark',
            OpenAPISourceThemeMode: 'dark',
            OpenAPISourceLightTheme: 'default',
            OpenAPISourceDarkTheme: 'default',
            syncOpenAPIPreviewTheme: true,
            syncOpenAPISourceTheme: true,
            OpenAPIViewDefaultMode: 'source',
            OpenAPIEntryGridLayoutColumns: 4,
        };
    }

    /**
     * Loads the plugin's settings from the plugin's data store.
     *
     * This method loads the plugin's settings from the plugin's data store, merges them with the default settings,
     * and assigns the resulting settings object to the plugin's `settings` property.
     *
     * @returns {Promise<void>} A promise that resolves when the settings have been loaded.
     */
    async loadSettings(): Promise<void> {
        const userSettings = (await this.plugin.loadData()) ?? {};
        const defaultSettings = this.defaultSettings;
        const settings = Object.assign({}, defaultSettings, userSettings);
        this.plugin.settings = {
            ...settings,
        };
    }

    /**
     * Saves the plugin's settings to the plugin's data store.
     *
     * This method takes the plugin's settings and saves them to the plugin's data store.
     *
     * @returns {Promise<void>} A promise that resolves when the settings have been saved.
     */
    async saveSettings(): Promise<void> {
        await this.plugin.saveData(this.plugin.settings);
    }

    /**
     * Resets the plugin's settings to their default values.
     *
     * This method removes the plugin's configuration file from disk and then reloads the plugin's settings
     * from their default values.
     *
     * @returns {Promise<void>} A promise that resolves when the settings have been reset.
     */
    async resetSettings(): Promise<void> {
        const pluginDir = this.plugin.manifest.dir;
        if (!pluginDir) {
            throw new Error('No plugin dir found');
        }
        const configPath = path.join(pluginDir, '/data.json');
        const existsPath =
            await this.plugin.app.vault.adapter.exists(configPath);
        if (existsPath) {
            await this.plugin.app.vault.adapter.remove(configPath);
        }
        await this.loadSettings();
    }
}
