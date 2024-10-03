import { App } from 'obsidian';
import React, { useEffect, useRef, useState } from 'react';
import OpenAPIRendererPlugin from '../../../core/openapi-renderer-plugin';
import { SettingsContainer } from '../styled/container-styled';
import OpenAPIViewSubSection from './OpenAPIViewSubSection';
import PreviewSubSection from './PreviewSubSection';
import SourceSubSection from './SourceSubSection';
import { SectionHeaderContainer } from './styled';

/**
 * The component that renders the OpenAPI View settings section
 *
 * @param app the Obsidian app instance
 * @param plugin the OpenAPI Renderer plugin instance
 * @returns a JSX element representing the OpenAPI View settings section
 */
const OpenAPIViewSection: React.FC<{
    app: App;
    plugin: OpenAPIRendererPlugin;
}> = ({ app, plugin }) => {
    const openAPIViewRef = useRef<HTMLDivElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const sourceRef = useRef<HTMLDivElement>(null);

    const [refsSet, setRefsSet] = useState(false);

    useEffect(() => {
        if (openAPIViewRef.current && previewRef.current && sourceRef.current) {
            setRefsSet(true);
        }
    }, [openAPIViewRef.current, previewRef.current, sourceRef.current]);

    return (
        <>
            <SettingsContainer className={'openapi-renderer-settings'}>
                <div ref={openAPIViewRef}>
                    <OpenAPIViewSubSection
                        app={app}
                        plugin={plugin}
                        containerEl={openAPIViewRef.current}
                    />
                </div>
                <SectionHeaderContainer>Preview</SectionHeaderContainer>
                <div ref={previewRef}>
                    <PreviewSubSection
                        app={app}
                        plugin={plugin}
                        containerEl={previewRef.current}
                    />
                </div>
                <SectionHeaderContainer>Source</SectionHeaderContainer>
                <div ref={sourceRef}>
                    <SourceSubSection
                        app={app}
                        plugin={plugin}
                        containerEl={sourceRef.current}
                    />
                </div>
            </SettingsContainer>
        </>
    );
};

export default OpenAPIViewSection;
