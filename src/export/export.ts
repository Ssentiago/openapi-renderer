import { Specification } from 'indexedDB/database/specification';
import OpenAPIRendererPlugin from 'main';
import { moment } from 'obsidian';
import Yazl from 'yazl';
import { OneFileVersionData, renderData, specData } from './interfaces';

export default class Export {
    constructor(public plugin: OpenAPIRendererPlugin) {}

    /**
     * Generates HTML for Swagger UI based on the provided specification.
     *
     * @param {string} spec - The specification to be used for generating Swagger UI.
     * @return {string} The generated HTML for Swagger UI.
     */
    private renderSwaggerUIHtml(spec: string): string {
        return `
            <!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <title>Swagger UI</title>
        <link
            rel="stylesheet"
            href="https://unpkg.com/swagger-ui-dist@3/swagger-ui.css"
        />
        <script src="https://unpkg.com/swagger-ui-dist@3/swagger-ui-bundle.js"></script>
    </head>
    <body>
        <div id="swagger-ui"></div>
        <script>
            window.onload = function() {
                let spec = ${spec};
                const ui = SwaggerUIBundle({
                    spec: spec,
                    dom_id: '#swagger-ui',
                    presets: [
                        SwaggerUIBundle.presets.apis,
                        SwaggerUIBundle.SwaggerUIStandalonePreset
                    ],
                    layout: "BaseLayout"
                });
            }
        </script>
    </body>
</html>
        `;
    }

    /**
     * Renders Swagger UI HTML for a list of file specifications.
     *
     * @param {Specification[]} specs - An array of file specifications.
     * @return {renderData} An object containing the path, name, and data for the rendered Swagger UI.
     */
    private renderSwaggerUIHtmlForFileSpecs(
        specs: Specification[]
    ): renderData {
        const data = specs.reduce<specData[]>((htmlStrings, spec) => {
            const specString = spec.getPatchedVersion(specs).diff as string;
            const specData = {
                version: spec.version,
                diff: this.renderSwaggerUIHtml(specString),
                time: new Date(spec.createdAt).getTime(),
                name: spec.name,
            };
            htmlStrings.push(specData);
            return htmlStrings;
        }, []);
        return {
            path: specs[0].path,
            data: data,
        };
    }

    /**
     * Renders Swagger UI HTML for a list of file specifications.
     *
     * @param {Record<string, Specification[]>} specsData - An object containing an array of file specifications for each key.
     * @return {renderData[]} An array of objects containing the path, name, and data for the rendered Swagger UI for each file specification.
     */
    private renderSwaggerUIHtmlForFiles(
        specsData: Record<string, Specification[]>
    ): renderData[] {
        return Object.entries(specsData).map(([_, specs]) =>
            this.renderSwaggerUIHtmlForFileSpecs(specs)
        );
    }

    async export(specs: OneFileVersionData): Promise<void>;
    async export(specs: Specification[]): Promise<void>;
    async export(specs: Record<string, Specification[]>): Promise<void>;

    async export(
        specs:
            | OneFileVersionData
            | Specification[]
            | Record<string, Specification[]>
    ): Promise<void> {
        let data: renderData | renderData[];
        if (Array.isArray(specs)) {
            if (specs.length === 0) {
                return;
            }

            data = this.renderSwaggerUIHtmlForFileSpecs(
                specs as Specification[]
            );
            await this.handleZip(data);
        } else {
            if (Object.keys(specs).includes('specs')) {
                await this.handleSaveOneVersion(specs as OneFileVersionData);
            } else {
                const specsRecord = specs as Record<string, Specification[]>;
                if (Object.keys(specsRecord).length === 0) {
                    return;
                }
                data = this.renderSwaggerUIHtmlForFiles(specsRecord);
                await this.handleZip(data);
            }
        }
    }

    private async handleSaveOneVersion(
        specData: OneFileVersionData
    ): Promise<void> {
        let diff = specData.spec.getPatchedVersion(specData.specs)
            .diff as string;
        diff = this.renderSwaggerUIHtml(diff);
        const path = specData.spec.path.match(/\/?(.+)\./)?.[1];
        const time = moment().format('YYYYMMDDHHmmss');
        await this.plugin.app.vault.adapter.write(
            `export-${(path && `${path}-`) ?? ''}${specData.spec.name}-${time}.html`,
            diff
        );
    }

    /**
     * Adds the files from the given renderData object to a zip file.
     *
     * @param {Yazl.ZipFile} zip - The zip file to add the files to.
     * @param {renderData} files - The renderData object containing the files to add.
     * @return {Promise<void>} A Promise that resolves when all files have been added.
     */
    private async addFilesToZip(
        zip: Yazl.ZipFile,
        files: renderData
    ): Promise<void> {
        for (const file of files.data) {
            const version = file.version;
            const time = moment(file.time).format('YYYYMMDDHHmmss');
            const path = files.path.match(/(.+)\..+$/);
            const filePath = `${path?.[1] ?? ''}/${file.name}-${version}-${time}.html`;

            const fileBuffer = Buffer.from(file.diff, 'utf8');

            zip.addBuffer(fileBuffer, filePath);
        }
    }

    private async handleZip(data: renderData): Promise<void>;
    private async handleZip(data: renderData[]): Promise<void>;

    /**
     * Handles the creation and saving of a ZIP file from the given data.
     *
     * @param {renderData | renderData[]} data - The data to be added to the ZIP file.
     * @return {Promise<void>} A Promise that resolves when the ZIP file is saved.
     */
    private async handleZip(data: renderData | renderData[]): Promise<void> {
        if (!Array.isArray(data)) {
            data = [data];
        }

        const zip = new Yazl.ZipFile();

        await Promise.all(data.map((file) => this.addFilesToZip(zip, file)));

        new Promise<Buffer>((resolve, reject) => {
            const chunks: Buffer[] = [];

            zip.outputStream
                .on('data', (chunk) => chunks.push(chunk))
                .on('end', () => resolve(Buffer.concat(chunks)))
                .on('error', reject);

            zip.end();
        })
            .then(async (buffer) => {
                const time = moment().format('YYYYMMDDHHmmss');
                const zipFilePath = `export-openapi-data-${time}.zip`;

                await this.plugin.app.vault.adapter.writeBinary(
                    zipFilePath,
                    buffer
                );
            })
            .catch((err) => {
                this.plugin.logger.error(
                    `Error when handling ZIP file: ${err.message}`
                );
            });
    }
}
