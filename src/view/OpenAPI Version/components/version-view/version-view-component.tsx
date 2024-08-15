import React, { useEffect } from 'react';
import { Specification } from 'indexedDB/database/specification';
import { OpenAPIVersionView } from '../../openapi-version-view';
import { ButtonBase, Container } from '../styled/styled-components';
import { useSpecificationContext } from '../core/context';
import DraftVersionComponent from '../draft-version/draft-version-component';
import NoVersionsMessage from '../core/no-versions-available';
import VersionListComponent from '../version-list/version-list-component';
import jsyaml from 'js-yaml';
import PreviewComponent from '../preview/preview-component';
import TwoPaneDiff from '../diff/diff-component';
import { OPENAPI_VIEW_TYPE } from '../../../types';
import { eventID, eventPublisher, Subject } from '../../../../typing/constants';
import { ReloadOpenAPIEntryStateEvent } from '../../../../typing/interfaces';

const VersionViewComponent: React.FC<{
    specifications?: Specification[];
    view: OpenAPIVersionView;
}> = ({ specifications = [], view }) => {
    const {
        specs,
        setSpecs,
        currentSpec,
        setCurrentSpec,
        setPreviewMode,
        isPreviewMode,
        isDiffMode,
        setDiffMode,
        selectedSpecs,
        setSelectedSpecs,
    } = useSpecificationContext();

    useEffect(() => {
        view.plugin.publisher.publish({
            eventID: eventID.ReloadOpenAPIEntryState,
            subject: Subject.All,
            publisher: eventPublisher.Settings,
            emitter: view.app.workspace,
            timestamp: new Date(),
        } as ReloadOpenAPIEntryStateEvent);
    }, [specs]);

    useEffect(() => {
        setSpecs(specifications);
    }, [specifications]);

    const handleBackToList = (): void => {
        setPreviewMode(false);
        setDiffMode(false);
        setCurrentSpec(undefined);
        setSelectedSpecs([]);
    };

    useEffect(() => {
        const handleBackButton = (event: MouseEvent): void => {
            if (event.button === 3) {
                handleBackToList();
            }
        };

        document.addEventListener('mouseup', handleBackButton);

        return (): void => {
            document.removeEventListener('mouseup', handleBackButton);
        };
    }, []);

    const updateSpecs = (): void => {
        const updatedSpecs = [...view.versions];
        setSpecs(updatedSpecs);
    };

    const getCurrentData = async (): Promise<string | undefined> => {
        const file = view.file;
        if (!file) {
            return;
        }
        let data = await view.app.vault.cachedRead(file);
        switch (file.extension) {
            case 'yaml':
            case 'yml':
                data = JSON.stringify(jsyaml.load(data));
                break;
            case 'json':
                break;
        }
        return data;
    };

    const handleCurrentPreview = async (): Promise<void> => {
        const data = await getCurrentData();
        if (!data) {
            return;
        }
        setCurrentSpec(data);
        setPreviewMode(true);
    };

    const handleSaveCurrentVersion = async (): Promise<void> => {
        const formData = await view.controller.versionUtils.getFormData();
        if (!formData) {
            return;
        }

        const saved = await view.controller.saveVersion(formData);
        if (saved) {
            view.plugin.showNotice('Saved successfully');
        } else {
            view.plugin.showNotice(
                'Version was not saved. ' +
                    'Please check the logs for more info'
            );
        }
    };

    const handleOpenInOpenAPIView = async (): Promise<void> => {
        const filePath = view.file?.path;
        if (!filePath) {
            return;
        }

        const openAPILeaves =
            view.app.workspace.getLeavesOfType(OPENAPI_VIEW_TYPE);

        const existingView = openAPILeaves.find(
            (leaf) => leaf.getViewState().state.file === filePath
        );

        if (existingView) {
            const newViewState = {
                ...existingView.getViewState(),
                active: true,
            };
            await existingView.setViewState(newViewState);
        } else {
            const leaf = view.app.workspace.getLeaf(true);
            await leaf.setViewState({
                type: OPENAPI_VIEW_TYPE,
                active: true,
                state: {
                    file: filePath,
                },
            });
        }
    };

    const handlePreviewData = (spec: Specification | string): string => {
        if (spec instanceof Specification) {
            return spec.getPatchedVersion(specs).diff;
        }
        return spec;
    };

    if (isPreviewMode && currentSpec) {
        return (
            <div>
                <ButtonBase onClick={handleBackToList}>Back</ButtonBase>
                <PreviewComponent
                    view={view}
                    data={handlePreviewData(currentSpec)}
                    resourceManager={view.plugin.resourceManager}
                    spec={currentSpec}
                />
            </div>
        );
    }

    if (isDiffMode && selectedSpecs.length === 2) {
        return (
            <div>
                <ButtonBase onClick={handleBackToList}>Back</ButtonBase>
                <TwoPaneDiff
                    leftSpec={selectedSpecs[0].getPatchedVersion(specs)}
                    rightSpec={selectedSpecs[1].getPatchedVersion(specs)}
                    view={view}
                />
            </div>
        );
    }

    return (
        <Container>
            <>
                <DraftVersionComponent
                    onPreview={handleCurrentPreview}
                    onSave={handleSaveCurrentVersion}
                    onSaveSuccess={updateSpecs}
                    onOpenInOpenAPIView={handleOpenInOpenAPIView}
                    onRestoreTo={() => {}}
                />
                {specs.length === 0 ? (
                    <NoVersionsMessage />
                ) : (
                    <VersionListComponent
                        view={view}
                        updateSpecs={updateSpecs}
                    />
                )}
            </>
        </Container>
    );
};

export default VersionViewComponent;
