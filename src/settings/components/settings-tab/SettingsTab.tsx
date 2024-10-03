import { App } from 'obsidian';
import React from 'react';
import OpenAPIRendererPlugin from '../../../core/openapi-renderer-plugin';
import { useSettingsContext } from '../core/context';
import GeneralSection from '../general-section/GeneralSection';
import Navbar from '../navbar/Navbar';
import OpenAPIEntrySection from '../openapi-entry-section/OpenAPIEntrySection';
import OpenAPIViewSection from '../openapi-view-section/OpenAPIViewSection';

/**
 * The main settings tab component for OpenAPI Renderer.
 *
 * This component renders the main settings page for OpenAPI Renderer, including
 * the navbar and the content of the currently selected tab.
 *
 * @param app The Obsidian app instance.
 * @param plugin The OpenAPI Renderer plugin instance.
 * @returns A React element representing the main settings page.
 */
const SettingsTab: React.FC<{
    app: App;
    plugin: OpenAPIRendererPlugin;
}> = ({ app, plugin }): React.ReactElement => {
    const { currentTab } = useSettingsContext();

    const renderContent = () => {
        switch (currentTab) {
            case 'general':
                return <GeneralSection app={app} plugin={plugin} />;
            case 'openapi-view':
                return <OpenAPIViewSection app={app} plugin={plugin} />;
            case 'openapi-entry-view':
                return <OpenAPIEntrySection app={app} plugin={plugin} />;
        }
    };

    return (
        <>
            <Navbar />
            {renderContent()}
        </>
    );
};
export default SettingsTab;
