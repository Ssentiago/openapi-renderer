import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import ResourceManager from '../../../../core/resource-manager';
import { Specification } from '../../../../indexedDB/database/specification';
import { OpenAPIVersionView } from '../../openapi-version-view';

interface PreviewProps {
    view: OpenAPIVersionView;
    data: string;
    resourceManager: ResourceManager;
    spec: Specification | string;
}

const PreviewHeader = styled.h1`
    font-size: 2.5rem;
    text-align: center;
    margin-top: 20px;
    color: var(--text-normal);
    border-bottom: 2px solid var(--interactive-accent);
    padding-bottom: 10px;
`;
const SpecDetails = styled.div`
    margin: 20px auto;
    padding: 20px;
    max-width: 600px;
    background-color: var(--background-primary);
    border-radius: 12px;
    box-shadow: 0 4px 12px var(--background-modifier-box-shadow);
    color: var(--text-normal);

    & > p {
        margin: 12px 0;
        font-size: 1.1rem;
        color: var(--text-muted);
    }
`;
const PreviewComponent: React.FC<PreviewProps> = ({
    view,
    data,
    resourceManager,
    spec,
}) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const parsedSpec = JSON.parse(data);

    const [combinedCSS, setCombinedCSS] = useState<string>('');

    useEffect(() => {
        const initSwagger = async (): Promise<void> => {
            if (!resourceManager.swaggerUIBundle) {
                await resourceManager.initSwaggerUIBundle();
            }

            if (containerRef.current) {
                if (!resourceManager.swaggerUIBundle) {
                    return;
                }
                resourceManager.swaggerUIBundle({
                    spec: parsedSpec,
                    domNode: containerRef.current,
                    presets: [
                        resourceManager.swaggerUIBundle.presets.apis,
                        resourceManager.swaggerUIBundle
                            .SwaggerUIStandalonePreset,
                    ],
                    layout: 'BaseLayout',
                });
            }
        };

        initSwagger().catch((err) => {});

        return (): void => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [data, resourceManager]);

    useEffect((): void => {
        const fetchCombinedCSS = async () => {
            const css = await view.controller.versionUtils.getCombinedCSS();
            setCombinedCSS(css);
        };

        fetchCombinedCSS();
    }, [view.controller.versionUtils]);

    return (
        <div>
            <style>{combinedCSS}</style>
            <PreviewHeader>{`PREVIEW MODE`}</PreviewHeader>
            {spec instanceof Specification && (
                <SpecDetails>
                    <p>Name: {spec.name}</p>
                    <p>Version: {spec.version}</p>
                    <p>
                        Created At: {new Date(spec.createdAt).toLocaleString()}
                    </p>
                </SpecDetails>
            )}
            <div ref={containerRef} />
        </div>
    );
};

export default PreviewComponent;
