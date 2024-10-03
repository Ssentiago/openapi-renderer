import { App, Setting } from 'obsidian';
import React, { useEffect } from 'react';
import OpenAPIRendererPlugin from '../../../core/openapi-renderer-plugin';
import { eventID } from '../../../events-management/typing/constants';
import { SettingsTabStateEvent } from '../../../events-management/typing/interfaces';
import { useSettingsContext } from '../core/context';
import { SettingsContainer } from '../styled/container-styled';

/**
 * A React component that renders the General settings section.
 *
 * This component renders several settings:
 *  - Reset settings to default
 *  - Download plugin`s assets from Github release
 *  - Resources autoupdate
 *
 * @param {App} app - The Obsidian app instance.
 * @param {OpenAPIRendererPlugin} plugin - The OpenAPI Renderer plugin instance.
 *
 * @returns {React.ReactElement} A React element.
 */
const GeneralSection: React.FC<{
    app: App;
    plugin: OpenAPIRendererPlugin;
}> = ({ app, plugin }) => {
    const { ref } = useSettingsContext();

    useEffect(() => {
        if (ref.current) {
            const containerEl = ref.current as HTMLElement;

            new Setting(containerEl)
                .setName('Reset settings to default')
                .addButton((button) => {
                    button.setIcon('refresh-ccw');
                    button.onClick(async () => {
                        try {
                            await plugin.settingsManager.resetSettings();
                            plugin.showNotice(
                                'Settings have been reset to default'
                            );
                            setTimeout(() => {
                                plugin.publisher.publish({
                                    eventID: eventID.SettingsTabState,
                                    timestamp: new Date(),
                                    emitter: app.workspace,
                                } as SettingsTabStateEvent);
                            }, 100);
                        } catch (e: any) {
                            plugin.showNotice(
                                'Oops... something went wrong. Please check the logs for more info'
                            );
                            plugin.logger.error(e.message);
                        }
                    });
                });

            new Setting(containerEl)
                .setName('Download plugin`s assets from Github release')
                .addButton((button) => {
                    button
                        .setIcon('github')
                        .onClick(async (cb): Promise<void> => {
                            await plugin.githubClient.downloadAssetsFromLatestRelease();
                        });
                });

            new Setting(containerEl)
                .setName('Resources autoupdate')
                .setDesc(
                    'Automatically download plugin assets from GitHub releases after each plugin update?'
                )
                .addToggle((toggle) => {
                    toggle
                        .setValue(plugin.settings.resourcesAutoUpdate)
                        .onChange(async (value) => {
                            plugin.settings.resourcesAutoUpdate = value;
                            await plugin.settingsManager.saveSettings();
                        });
                });
        }
    }, [ref]);

    return (
        <SettingsContainer className="openapi-renderer-settings" ref={ref} />
    );
};

export default GeneralSection;
