import { App } from 'obsidian';
import path from 'path';
import { SwaggerUIBundle } from '../view/typing/swagger-ui-typings';
import OpenAPIRendererPlugin from './openapi-renderer-plugin';

export default class ResourceManager {
    private resourceCache: Map<string, string> = new Map();
    private assetsPath!: string;
    public swaggerUIBundle: SwaggerUIBundle | null = null;

    constructor(
        public app: App,
        public plugin: OpenAPIRendererPlugin
    ) {
        this.initializeAssetsPath().catch((err: any) => {
            this.plugin.showNotice(err.message);
            throw err;
        });
    }

    /**
     * Initialize the path to the assets directory.
     *
     * @returns {Promise<void>} - A promise that resolves when the assets path is set.
     * @throws {Error} - Throws an error if the plugin directory is not found.
     */
    async initializeAssetsPath(): Promise<void> {
        const pluginDir = this.plugin.manifest.dir;
        if (!pluginDir) {
            throw new Error('No plugin directory found');
        }

        this.assetsPath = path.join(pluginDir, 'assets');
    }

    /**
     * Get the content of a resource file by its path.
     *
     * This method uses a cache to store the resource content. If the resource
     * is not found in the cache, it is read from the file system and stored in
     * the cache.
     *
     * @param resourcePath - The path to the resource file.
     * @returns {Promise<string>} - A promise that resolves to the resource content.
     * @throws {Error} - If the resource file is not found
     */
    private async getResource(resourcePath: string): Promise<string> {
        const cachedResource = this.resourceCache.get(resourcePath);
        if (cachedResource) {
            return cachedResource;
        }

        try {
            const resource = await this.app.vault.adapter.read(resourcePath);
            this.resourceCache.set(resourcePath, resource);
            return resource;
        } catch (err: any) {
            this.plugin.logger.error(
                `Error while reading file in view: ${err.message}`
            );
            throw new Error(
                'Error while reading a resource file. Try re-download it'
            );
        }
    }

    /**
     * Gets the content of a CSS file by its name.
     *
     * The folder for the CSS file is determined as follows:
     * - If the CSS file is `visual-diff.css`, the folder is `jsondiffpatch`.
     * - Otherwise, the folder is `swagger-ui`.
     *
     * @param cssName - The name of the CSS file.
     * @returns {Promise<string>} - A promise that resolves to the content of the CSS file.
     * @throws {Error} - If the CSS file is not found
     */
    async getCSS(cssName: string): Promise<string> {
        let folder: string;
        if (cssName === 'visual-diff.css') {
            folder = 'jsondiffpatch';
        } else {
            folder = 'swagger-ui';
        }
        const cssPath = path.join(this.assetsPath, folder, cssName);

        return this.getResource(cssPath);
    }

    /**
     * Initializes the Swagger UI bundle.
     *
     * This method reads the Swagger UI bundle from the plugin's assets directory and
     * initializes it. The bundle is stored in the `swaggerUIBundle` property.
     *
     * If the bundle has already been initialized, this method does nothing.
     *
     * If the bundle could not be initialized, an error is logged and a notice is shown
     * to the user.
     *
     * @returns {Promise<void>} - A promise that resolves when the bundle has been initialized.
     */
    async initSwaggerUIBundle(): Promise<void> {
        if (this.swaggerUIBundle) {
            return;
        }
        const pluginDir = this.plugin.manifest.dir;
        if (!pluginDir) {
            throw new Error('No plugin dir found');
        }

        const assetsPath = path.join(
            pluginDir,
            'assets',
            'swagger-ui',
            'swagger-ui-bundle.js'
        );

        try {
            const swaggerContent =
                await this.plugin.app.vault.adapter.read(assetsPath);
            this.swaggerUIBundle = new Function(
                `${swaggerContent}
                    return SwaggerUIBundle;`
            )();
        } catch (error: any) {
            this.plugin.logger.error(
                `Error initializing SwaggerUIBundle: ${error.message}`
            );
            this.plugin.showNotice(
                'Failed to initialize SwaggerUI. Please check the logs for details.'
            );
        }
    }
}
