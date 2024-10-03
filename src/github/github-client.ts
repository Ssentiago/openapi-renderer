import { Octokit } from '@octokit/rest';
import fs from 'fs';
import https from 'https';
import path from 'path';
import { pipeline } from 'stream/promises';
import * as tar from 'tar';
import { createGunzip } from 'zlib';
import OpenAPIRendererPlugin from '../core/openapi-renderer-plugin';

export default class GithubClient {
    private octokit: Octokit;
    private owner = 'Ssentiago';
    private repo = 'obsidian-openapi-renderer';
    private tag: string;

    constructor(public plugin: OpenAPIRendererPlugin) {
        this.octokit = new Octokit();
        this.tag = this.plugin.manifest.version;
    }

    /**
     * Retrieves artefacts from the latest release based on the provided name.
     *
     * Fetches release data from GitHub using the specified tag, filters artefacts by name,
     * and returns an array of objects containing the name and download URL of each matching artefact.
     *
     * @param {string} name - The name of the artefact to retrieve.
     * @returns {Promise<{ name: string; download_url: string }[]>} - A promise that resolves to an array of artefacts with their names and download URLs.
     * @throws {Error} - Throws an error if there is a problem fetching the release data.
     */
    async getArtefactFromLatestRelease(
        name: string
    ): Promise<{ name: string; download_url: string }[]> {
        try {
            const { data: release } = await this.octokit.repos.getReleaseByTag({
                owner: this.owner,
                repo: this.repo,
                tag: this.tag,
            });

            return release.assets
                .filter((asset) => asset.name === name)
                .map((asset) => ({
                    name: asset.name,
                    download_url: asset.browser_download_url,
                }));
        } catch (error: any) {
            this.plugin.logger.error(
                `Error fetching release for tag ${this.tag}: ${error.message}`
            );
            throw error;
        }
    }

    /**
     * Downloads and extracts plugin assets from the latest release.
     *
     * Retrieves the 'assets.tar.gz' artefact from the latest release, downloads it,
     * extracts the contents to the plugin's assets directory, and cleans up temporary files.
     * Shows a notification upon success or failure.
     *
     * @returns {Promise<void>} - A promise that resolves when assets are successfully downloaded and extracted.
     * @throws {Error} - Throws an error if the asset cannot be found, downloaded, or extracted.
     */
    async downloadAssetsFromLatestRelease(): Promise<void> {
        const pluginPath = this.plugin.manifest.dir;
        const basePath = this.plugin.app.vault.getRoot().vault.adapter.basePath;
        if (pluginPath) {
            const relativeAssetsPath = path.join(pluginPath, 'assets');
            const fullAssetsPath = path.join(basePath, relativeAssetsPath);
            const archivePath = path.join(
                basePath,
                pluginPath,
                'assets.tar.gz'
            );
            await this.plugin.app.vault.adapter.mkdir(relativeAssetsPath);

            try {
                const artefact =
                    await this.getArtefactFromLatestRelease('assets.tar.gz');
                if (artefact.length === 0) {
                    throw new Error('Asset not found in release');
                }
                const asset = artefact[0];

                await this.downloadFile(asset.download_url, archivePath);

                await this.extractArchive(archivePath, fullAssetsPath);
                fs.unlinkSync(archivePath);
                this.plugin.showNotice(
                    'Plugin assets downloaded and extracted successfully.'
                );
            } catch (err: any) {
                this.plugin.showNotice(
                    'Failed to download or extract plugin assets. ' +
                        'Please check the logs for more info'
                );
                this.plugin.logger.error(err.message);
                throw err;
            }
        }
    }

    /**
     * Downloads a file from a given URL to a specified file path.
     *
     * Handles HTTP redirects and writes the file content to the local file system.
     * Rejects the promise if the request fails or the status code indicates an error.
     *
     * @param {string} url - The URL to download the file from.
     * @param {string} filePath - The local file path to save the downloaded file.
     * @returns {Promise<void>} - A promise that resolves when the file is successfully downloaded.
     * @throws {Error} - Throws an error if the request fails, status code is not 200, or redirect location is invalid.
     */
    private downloadFile(url: string, filePath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            https
                .get(
                    url,
                    { headers: { 'User-Agent': 'Node.js' } },
                    (response) => {
                        if (response.statusCode === 302) {
                            const redirectUrl = response.headers.location;
                            if (redirectUrl) {
                                this.downloadFile(redirectUrl, filePath)
                                    .then(resolve)
                                    .catch(reject);
                            } else {
                                reject(
                                    new Error(
                                        'Redirect location is missing or invalid'
                                    )
                                );
                            }
                            return;
                        }
                        if (response.statusCode !== 200) {
                            reject(
                                new Error(
                                    `Failed to get '${url}' (${response.statusCode})`
                                )
                            );
                            return;
                        }
                        const fileStream = fs.createWriteStream(filePath);
                        pipeline(response, fileStream)
                            .then(() => resolve())
                            .catch(reject);
                    }
                )
                .on('error', reject);
        });
    }

    /**
     * Extracts a `.tar.gz` archive to a specified directory.
     *
     * Handles both `.tar.gz` and plain `.tar` files by trying to unzip first and falling back to plain extraction if needed.
     * Uses `tar` to extract files and handles errors during extraction.
     *
     * @param {string} archivePath - Path to the `.tar.gz` archive file.
     * @param {string} extractPath - Directory where the archive will be extracted.
     * @returns {Promise<void>} - A promise that resolves when the extraction is complete.
     * @throws {Error} - Throws an error if extraction fails.
     */
    private async extractArchive(
        archivePath: string,
        extractPath: string
    ): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const extract = tar.extract({ cwd: extractPath, strip: 1 });

            const fileStream = fs.createReadStream(archivePath);
            const gunzip = createGunzip();

            fileStream
                .pipe(gunzip)
                .pipe(extract)
                .on('error', (err) => {
                    // If gunzip fails, try without it (might be a plain tar)
                    fileStream.unpipe(gunzip);
                    fileStream
                        .pipe(extract)
                        .on('error', (tarErr) => {
                            this.plugin.logger.error(
                                `Tar extraction error: ${tarErr.message}`
                            );
                            reject(tarErr);
                        })
                        .on('finish', () => {
                            resolve();
                        });
                })
                .on('finish', () => {
                    resolve();
                });
        });
    }
}
