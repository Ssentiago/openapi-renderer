import OpenAPIRendererPlugin from "../main";
import {OpenAPIRendererEventPublisher} from "../pluginEvents/eventEmitter";
import {App, Setting} from "obsidian";
import {SettingsSection} from "../typing/interfaces";

export class ServerSettings implements SettingsSection {
    app: App;
    plugin: OpenAPIRendererPlugin
    publisher: OpenAPIRendererEventPublisher

    constructor(
        app: App,
        plugin: OpenAPIRendererPlugin,
        publisher: OpenAPIRendererEventPublisher) {
        this.app = app
        this.plugin = plugin
        this.publisher = publisher
    }

    display(containerEl: HTMLElement) {

        new Setting(containerEl)
            .setName('Server settings')
            .setHeading()

        new Setting(containerEl)
            .setName('Server Status')
            .setDesc('Check if the server is running')
            .addButton(button => {
                const updateButtonState = () => {
                    if (this.plugin.server.isRunning()) {
                        button.setIcon('check-circle').setTooltip('Server is running');
                    } else {
                        button.setIcon('x-circle').setTooltip('Server is not running');
                    }
                };

                updateButtonState();

                button.onClick(async () => {
                    if (this.plugin.server.isRunning()) {
                        this.plugin.showNotice('Pong! Server is running.');
                    } else {
                        const startServer = await this.plugin.server.start();
                        if (startServer) {
                            this.plugin.showNotice('Server started successfully!');
                        } else {
                            this.plugin.showNotice('Failed to start server. Check logs for details.');
                        }
                    }
                    updateButtonState();
                });
            });
        new Setting(containerEl)
            .setName('Autostart server')
            .setDesc('Will the server automatically start when the app is opened?')
            .addToggle((toggle) => toggle
                .setValue(this.plugin.settings.isServerAutoStart)
                .onChange(async (value) => {
                    this.plugin.settings.isServerAutoStart = value;
                    await this.plugin.saveSettings()
                })
            );

        new Setting(containerEl)
            .setName('Server listening port')
            .setDesc('The port number on which the OpenAPI Renderer server will listen for connections.')
            .addText(text => {
                    text.setPlaceholder('8080')
                        .setValue(this.plugin.settings.serverPort.toString())

                    let handler = this.plugin.eventsHandler.settingsTabServerPortBlur.bind(this.plugin.eventsHandler, text)
                    this.plugin.registerDomEvent(text.inputEl, 'blur', handler);
                    text.inputEl.id = 'openapi-input-port'
                }
            ).addExtraButton(button => {
            button.setIcon('info')
                .setTooltip('Valid port numbers are between 1024 and 65535', {delay: 100})
        })
    }


}