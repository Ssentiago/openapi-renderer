import { EntryViewData } from 'indexedDB/typing/interfaces';
import React, { useEffect } from 'react';

import { eventID } from '../../../../events-management/typing/constants';
import { OpenAPIEntryView } from '../../OpenAPI-entry-view';
import { useEntryContext } from '../core/context';
import NoTrackedFilesFound from '../core/no-tracked-files-found';
import GridContainerComponent from '../grid/grid-container-component';
import Navbar from '../navbar/navbar-component';
import {
    Description,
    EntryContainer,
    WelcomeMessage,
} from './entry-view-styled-components';

const EntryViewComponent: React.FC<{
    outerSpecData: EntryViewData;
    view: OpenAPIEntryView;
}> = ({ outerSpecData, view }) => {
    const { setSpecData, specData, currentPage } = useEntryContext();

    useEffect(() => {
        setSpecData(outerSpecData);
    }, [outerSpecData]);

    useEffect(() => {
        view.plugin.observer.subscribe(
            view.app.workspace,
            eventID.ReloadOpenAPIEntryState,
            async () => {
                const newSpecsData = await view.controller.getEntryViewData();
                setSpecData(newSpecsData);
            }
        );
    }, []);

    // if (currentPage === 'create') {
    //     return (
    //         <>
    //             <Navbar />
    //             <FileDialogComponent view={view} />
    //         </>
    //     );
    // }

    if (currentPage === 'browse') {
        if (Object.keys(specData).length === 0) {
            return (
                <>
                    <Navbar />
                    <NoTrackedFilesFound />
                </>
            );
        }
        return (
            <>
                <Navbar />
                <GridContainerComponent view={view} />
            </>
        );
    }
    if (currentPage === 'entry') {
        return (
            <>
                <Navbar />
                <EntryContainer>
                    <WelcomeMessage>OpenAPI Entry</WelcomeMessage>
                    <Description>
                        Start by browsing your existing files to continue
                        working on your API projects.
                    </Description>
                </EntryContainer>
            </>
        );
    }
};

export default EntryViewComponent;
