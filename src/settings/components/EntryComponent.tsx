import React from 'react';
import { App } from 'obsidian';
import OpenAPIRendererPlugin from 'core/openapi-renderer-plugin';
import { SettingProvider } from './core/context';
import SettingsTab from './settings-tab/SettingsTab';

const EntryComponent: React.FC<{
    app: App;
    plugin: OpenAPIRendererPlugin;
}> = ({ app, plugin }) => (
    <SettingProvider>
        <SettingsTab app={app} plugin={plugin} />
    </SettingProvider>
);

export default EntryComponent;
