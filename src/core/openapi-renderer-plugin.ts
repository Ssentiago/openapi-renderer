import {
    EventObserver,
    EventPublisher,
} from 'events-management/events-management';
import Export from 'export/export';
import { Notice, Plugin, WorkspaceLeaf } from 'obsidian';
import { OpenAPISettingTab } from 'settings/settings';
import { OpenAPIView } from 'view/OpenAPI/OpenAPI-view';
import { eventID } from '../events-management/typing/constants';
import { PowerOffEvent } from '../events-management/typing/interfaces';
import { FileWatcher } from '../filewatcher/filewatcher';
import GithubClient from '../github/github-client';
import { WorkerHelper } from '../indexedDB/worker/helper';
import LoggingManager from '../logging/logging-manager';
import SettingsManager, {
    DEFAULT_SETTINGS_Interface,
} from '../settings/settingsManager';
import { OpenAPIEntryView } from '../view/OpenAPI Entry/OpenAPI-entry-view';
import { OpenAPIVersionView } from '../view/OpenAPI Version/openapi-version-view';
import {
    OPENAPI_ENTRY_VIEW_TYPE,
    OPENAPI_VERSION_VIEW_TYPE,
    OPENAPI_VIEW_TYPE,
} from '../view/typing/types';
import ResourceManager from './resource-manager';
import StateChecker, { State } from './state-checker';

export default class OpenAPIRendererPlugin extends Plugin {
    settings!: DEFAULT_SETTINGS_Interface;
    settingsTab!: OpenAPISettingTab;
    logger!: LoggingManager;
    publisher!: EventPublisher;
    observer!: EventObserver;
    githubClient!: GithubClient;
    settingsManager!: SettingsManager;
    pluginUtils!: StateChecker;
    stateChecker!: StateChecker;
    resourceManager!: ResourceManager;
    export!: Export;
    fileWatcher!: FileWatcher;
    workerHelper!: WorkerHelper;

    /**
     * Lifecycle method called when the plugin is loaded.
     *
     * This method initializes the plugin and all its components.
     *
     * @returns A promise that resolves when the plugin has been initialized.
     */
    async onload(): Promise<void> {
        await this.initializePlugin();
    }

    /**
     * Lifecycle method called when the plugin is unloaded.
     *
     * This method cleans up after the plugin by publishing a `PowerOffEvent` to notify other components that the plugin
     * is no longer active.
     *
     * @returns A promise that resolves when the plugin has been unloaded.
     */
    async onunload(): Promise<void> {
        const event = {
            eventID: eventID.PowerOff,
            timestamp: new Date(),
            emitter: this.app.workspace,
        } as PowerOffEvent;
        this.publisher.publish(event);
    }

    /**
     * Initializes the plugin by creating and loading core components, setting up event listeners,
     * establishing networking connections, creating UI components, and initializing utility classes.
     *
     * This method is called when the plugin is loaded.
     *
     * @returns A promise that resolves when the plugin has been initialized.
     */
    private async initializePlugin(): Promise<void> {
        await this.initializeCore();
        this.initializeEventSystem();
        await this.initializeNetworking();
        await this.initializeUI();
        await this.initializeUtilities();
        this.addSettingTab(new OpenAPISettingTab(this.app, this));
    }

    /**
     * Initializes the core components of the plugin.
     *
     * This method creates and initializes the settings manager, logger, and resource manager.
     *
     * @returns A promise that resolves when the core components have been initialized.
     */
    private async initializeCore(): Promise<void> {
        this.settingsManager = new SettingsManager(this);
        await this.settingsManager.loadSettings();
        this.logger = new LoggingManager(this);
        this.resourceManager = new ResourceManager(this.app, this);
    }

    /**
     * Initializes the event system components of the plugin.
     *
     * This method creates and initializes the event publisher and observer.
     *
     * @private
     */
    private initializeEventSystem(): void {
        this.publisher = new EventPublisher(this);
        this.observer = new EventObserver(this);
    }

    /**
     * Initializes the networking components of the plugin.
     *
     * This method creates a new instance of `GithubClient` and assigns it to the `githubClient` property.
     *
     * @returns A promise that resolves when the networking components have been initialized.
     */
    private async initializeNetworking(): Promise<void> {
        this.githubClient = new GithubClient(this);
    }

    /**
     * Initializes the UI components of the plugin.
     *
     * This method registers three views: `OpenAPIView`, `OpenAPIVersionView`, and `OpenAPIEntryView`.
     * It also registers extensions for YAML, YML, and JSON files so that they can be opened with the
     * `OpenAPIView` by default.
     *
     * Additionally, this method adds a ribbon icon for opening the `OpenAPIEntryView` and a command
     * for opening the `OpenAPIEntryView` from the command palette.
     *
     * @returns A promise that resolves when the UI components have been initialized.
     */
    private async initializeUI(): Promise<void> {
        this.registerView(
            OPENAPI_VIEW_TYPE,
            (leaf) => new OpenAPIView(leaf, this)
        );

        this.registerExtensions(['yaml', 'yml', 'json'], OPENAPI_VIEW_TYPE);

        this.registerView(
            OPENAPI_VERSION_VIEW_TYPE,
            (leaf: WorkspaceLeaf) => new OpenAPIVersionView(leaf, this)
        );

        this.registerView(
            OPENAPI_ENTRY_VIEW_TYPE,
            (leaf: WorkspaceLeaf) => new OpenAPIEntryView(leaf, this)
        );

        this.addRibbonIcon(
            'file-search-2',
            'Open OpenAPI Entry View',
            async () => {
                const leaf = this.app.workspace.getLeaf(true);
                await leaf.setViewState({
                    type: OPENAPI_ENTRY_VIEW_TYPE,
                    active: true,
                    state: {},
                });
                this.app.workspace.revealLeaf(leaf);
            }
        );

        this.addCommand({
            id: 'openapi-renderer-open-openapi-entry',
            name: 'OpenAPI Entry',
            icon: 'file-search-2',
            callback: async () => {
                const leaf = this.app.workspace.getLeaf(true);
                await leaf.setViewState({
                    type: OPENAPI_ENTRY_VIEW_TYPE,
                    active: true,
                    state: {},
                });
                this.app.workspace.revealLeaf(leaf);
            },
        });
    }

    /**
     * Initializes the utility components of the plugin.
     *
     * This method creates instances of several utility classes:
     * - `StateChecker`: This utility checks the state of the plugin, determining if it is being launched for the first time or if there are updates available. It shows appropriate notifications based on its findings.
     * - `FileWatcher`: This utility monitors file changes in the workspace, allowing the plugin to respond to file renames
     * - `Export`: This utility handles the export functionality of the plugin and is utilized in views to allow users to export specifications
     *
     * It also checks the plugin's state by invoking `checkState` on the `StateChecker`.
     *
     * @returns A promise that resolves when all utility components have been initialized.
     */
    private async initializeUtilities(): Promise<void> {
        this.stateChecker = new StateChecker(this);
        await this.stateChecker.checkState();
        this.fileWatcher = new FileWatcher(this);
        this.export = new Export(this);
        this.workerHelper = new WorkerHelper();
    }

    /**
     * Displays a notice to the user with the given message.
     *
     * @param message The message to be displayed to the user.
     * @param duration The duration, in milliseconds, that the notice should be displayed.
     */
    showNotice(message: string, duration?: number): void {
        new Notice(message, duration);
    }
}
