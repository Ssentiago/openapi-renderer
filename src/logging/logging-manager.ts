import * as fs from 'fs';
import { moment } from 'obsidian';
import * as path from 'path';
import OpenAPIRendererPlugin from '../core/openapi-renderer-plugin';
import os from 'os';

export default class LoggingManager {
    private maxFileSize = 1024 * 1024; // Maximum log file size in bytes (1 MB)
    private readonly logDir;

    constructor(public plugin: OpenAPIRendererPlugin) {
        const pluginDir = this.plugin.manifest.dir;
        if (pluginDir) {
            this.logDir = path.join(
                this.plugin.app.vault.adapter.basePath,
                pluginDir,
                'logs'
            );
            this.ensureLogDirExists();
        } else {
            throw new Error('Plugin dir not found');
        }
    }

    /**
     * Checks if the log directory exists and creates it if it does not.
     */
    private ensureLogDirExists(): void {
        fs.access(this.logDir, fs.constants.F_OK, (err) => {
            if (err) {
                fs.mkdir(this.logDir, { recursive: true }, (err) => {
                    if (err) {
                        console.error('Error creating log directory:', err);
                    }
                });
            }
        });
    }

    /**
     * Gets the path to the log file.
     *
     * @returns The path to the log file.
     */
    private get logFilePath(): string {
        return path.join(this.logDir, 'logs.log');
    }

    /**
     * Renames the current log file to include the current timestamp.
     *
     * The file is renamed to "logs_<timestamp>.txt" where <timestamp> is the
     * current timestamp in the format "YYYYMMDDHHmmss".
     */
    private rotateLogs(): void {
        const logPath = this.logFilePath;
        const timestamp = moment().format('YYYYMMDDHHmmss');
        const rotatedLogPath = path.join(this.logDir, `logs_${timestamp}.txt`);

        fs.rename(logPath, rotatedLogPath, (err) => {
            if (err) {
                console.error('Error rotating log file:', err);
            }
        });
    }

    /**
     * Writes a log entry to the log file.
     *
     * @param level The log level (e.g. "debug", "info", "warn", "error").
     * @param message The log message.
     */
    private log(level: string, message: string): void {
        const err = new Error();
        const stackLines = err.stack?.split('\n');

        const filteredStack = [
            ...stackLines!.slice(0, 1),
            ...stackLines!.slice(3),
        ].join('\n');

        const logEntry = {
            timestamp: new Date().toISOString(),
            level: level,
            message: message,
            context: filteredStack,
            system: {
                platform: os.platform(),
                release: os.release(),
                arch: os.arch(),
            },
        };
        const logMessage = `${JSON.stringify(logEntry, null, 2)}\n`;
        const logPath = this.logFilePath;

        fs.access(logPath, fs.constants.F_OK, (err) => {
            if (err) {
                // The file does not exist, create a new log file
                fs.writeFile(logPath, logMessage, (err) => {
                    if (err) {
                        console.error('Error writing to log file:', err);
                    }
                });
            } else {
                // The file exists, check the size and add an entry
                fs.stat(logPath, (err, stats) => {
                    if (err) {
                        console.error('Error checking log file size:', err);
                    } else if (stats.size >= this.maxFileSize) {
                        // File exceeds size, perform rotation
                        this.rotateLogs();
                        fs.writeFile(logPath, logMessage, (err) => {
                            if (err) {
                                console.error(
                                    'Error writing to new log file:',
                                    err
                                );
                            }
                        });
                    } else {
                        // Write to the current log file
                        fs.appendFile(logPath, logMessage, (err) => {
                            if (err) {
                                console.error(
                                    'Error writing to log file:',
                                    err
                                );
                            }
                        });
                    }
                });
            }
        });
    }

    /**
     * Writes a DEBUG level log entry.
     *
     * @param message The log message.
     */
    debug(message: string): void {
        this.log('DEBUG', message);
    }

    /**
     * Writes an INFO level log entry.
     *
     * @param message The log message.
     */
    info(message: string): void {
        this.log('INFO', message);
    }

    /**
     * Writes a WARNING level log entry.
     *
     * @param message The log message.
     */
    warn(message: string): void {
        this.log('WARNING', message);
    }

    /**
     * Writes an ERROR level log entry.
     *
     * @param message The log message.
     */
    error(message: string): void {
        this.log('ERROR', message);
    }
}
