import { App, Setting } from 'obsidian';
import React, { useEffect } from 'react';
import OpenAPIRendererPlugin from '../../../core/openapi-renderer-plugin';
import { eventID } from '../../../events-management/typing/constants';
import { ChangeGridColumnsStateEvent } from '../../../events-management/typing/interfaces';
import { useSettingsContext } from '../core/context';
import { SettingsContainer } from '../styled/container-styled';

/**
 * A React component that renders the OpenAPI Entry settings section.
 *
 * This component renders several settings:
 *  - Grid Layout Columns
 *
 * @param {App} app - The Obsidian app instance.
 * @param {OpenAPIRendererPlugin} plugin - The OpenAPI Renderer plugin instance.
 *
 * @returns {React.ReactElement} A React element.
 */
const OpenAPIEntrySection: React.FC<{
    app: App;
    plugin: OpenAPIRendererPlugin;
}> = ({ app, plugin }) => {
    const { ref } = useSettingsContext();

    useEffect(() => {
        if (ref.current) {
            const containerEl = ref.current as HTMLElement;
            new Setting(containerEl)
                .setName('Grid Layout Columns')
                .addDropdown((dropdown) => {
                    for (let i = 1; i < 6; i++) {
                        const n = i.toString();
                        dropdown.addOption(n, n);
                    }
                    dropdown.setValue(
                        plugin.settings.OpenAPIEntryGridLayoutColumns.toString()
                    );
                    dropdown.onChange(async (value) => {
                        dropdown.setValue(value);
                        plugin.settings.OpenAPIEntryGridLayoutColumns =
                            parseInt(value, 10);
                        await plugin.settingsManager.saveSettings();
                        plugin.publisher.publish({
                            eventID: eventID.ChangeGridColumnsState,
                            emitter: app.workspace,
                            timestamp: new Date(),
                            data: { value: parseInt(value, 10) },
                        } as ChangeGridColumnsStateEvent);
                    });
                });
        }
    });

    return (
        <SettingsContainer className={'openapi-renderer-settings'} ref={ref} />
    );
};

export default OpenAPIEntrySection;
