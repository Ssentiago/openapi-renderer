import OpenAPIRendererPlugin from './openapi-renderer-plugin';

export const enum State {
    UPDATE = 'update',
    FIRST = 'first',
    NONE = 'none',
}

export default class StateChecker {
    constructor(public plugin: OpenAPIRendererPlugin) {}

    /**
     * Checks the state of the plugin.
     *
     * The state can be one of:
     * - `State.FIRST`: The plugin is being opened for the first time.
     * - `State.UPDATE`: The plugin has been updated.
     * - `State.NONE`: No update or first open.
     *
     * Depending on the state, the method:
     * - For `State.FIRST`, shows a notice to the user to download the resources in the plugin settings.
     * - For `State.UPDATE`, shows a notice to the user that the plugin has been updated and that the resources
     *   should be updated in the plugin settings. If the `isResourcesAutoUpdate` setting is `true`, the method
     *   downloads the latest resources from the latest release.
     * - Does nothing for `State.NONE`.
     *
     * @returns A promise that resolves when the method has finished running.
     */
    async checkState(): Promise<void> {
        const state = await this.getState();

        switch (state) {
            case State.FIRST:
                this.plugin.showNotice(
                    'This seems to be the first launch of the OpenAPI Renderer plugin. Please download the resources in the plugin settings, otherwise it may not work correctly.',
                    7000
                );
                break;
            case State.UPDATE:
                if (this.plugin.settings.resourcesAutoUpdate) {
                    this.plugin.showNotice(
                        'An update for the OpenAPI Renderer plugin has been identified. Downloading the latest resources. This may take a moment.',
                        4000
                    );
                    setTimeout(async () => {
                        await this.plugin.githubClient.downloadAssetsFromLatestRelease();
                    }, 4000);
                } else {
                    this.plugin.showNotice(
                        'OpenAPI Renderer plugin update detected. It is recommended to update resources in settings to ensure stable operation.'
                    );
                }
                break;
            case State.NONE:
                break;
            default:
                throw new Error();
        }
    }

    /**
     * Gets the state of the plugin.
     *
     * The state can be one of:
     * - `State.FIRST`: The plugin is being opened for the first time.
     * - `State.UPDATE`: The plugin has been updated.
     * - `State.NONE`: No update or first open.
     *
     * @returns {Promise<State>} - The state of the plugin.
     */
    private async getState(): Promise<State> {
        if (await this.isFirstOpenPlugin()) {
            return State.FIRST;
        } else if (await this.wasAnUpdate()) {
            return State.UPDATE;
        }
        return State.NONE;
    }

    /**
     * Determines if the plugin is being opened for the first time.
     *
     * Compares current plugin metadata with stored metadata in local storage. Updates local storage if it's the first launch.
     *
     * @returns `true` if it's the first time the plugin is opened, otherwise `false`.
     */
    private async isFirstOpenPlugin(): Promise<boolean> {
        const pluginMetadata = await this.getPluginMetadata();

        const localStoragePluginMetadata = localStorage.getItem(
            'openapi-renderer-metadata'
        );

        if (!localStoragePluginMetadata) {
            localStorage.setItem(
                'openapi-renderer-metadata',
                pluginMetadata.toString()
            );
            return true;
        }
        const localStoragePluginMetadataNumber = parseInt(
            localStoragePluginMetadata,
            10
        );

        if (
            isNaN(localStoragePluginMetadataNumber) ||
            pluginMetadata !== localStoragePluginMetadataNumber
        ) {
            localStorage.setItem(
                'openapi-renderer-metadata',
                pluginMetadata.toString()
            );
            return true;
        }
        return false;
    }

    /**
     * Checks if the plugin has been updated since the last recorded version.
     *
     * Compares the current plugin version with the stored version in local storage. Updates the stored version if it has changed.
     *
     * @returns `true` if the plugin version has been updated, otherwise `false`.
     */
    private async wasAnUpdate(): Promise<boolean> {
        const storedPluginVersion = localStorage.getItem(
            'openapi-renderer-version'
        );
        const currentVersion = this.plugin.manifest.version;
        if (
            storedPluginVersion === null ||
            storedPluginVersion !== currentVersion
        ) {
            localStorage.setItem(
                'openapi-renderer-version',
                this.plugin.manifest.version
            );
            return true;
        }
        return false;
    }

    /**
     * Retrieves the last modification time of the plugin directory in milliseconds.
     *
     * @returns A promise that resolves with the last modification time of the plugin directory in milliseconds.
     */
    private async getPluginMetadata(): Promise<number> {
        const { basePath } = this.plugin.app.vault.adapter;
        const { dir: pluginDir } = this.plugin.manifest;

        if (!pluginDir) {
            throw new Error('No plugin dir found.');
        }

        const pluginDirStat =
            await this.plugin.app.vault.adapter.stat(pluginDir);
        return pluginDirStat?.ctime ?? 0;
    }
}
