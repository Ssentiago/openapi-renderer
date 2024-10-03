import React from 'react';
import { EntryViewData } from 'indexedDB/typing/interfaces';
import { OpenAPIEntryView } from '../OpenAPI-entry-view';
import { EntryProvider } from './core/context';
import EntryViewComponent from './entry-view/entry-view-component';
import { SettingsComponent } from './settings-component/settings=component';

const EntryViewEntry: React.FC<{
    view: OpenAPIEntryView;
    specData: EntryViewData;
}> = ({ specData, view }) => (
    <EntryProvider>
        <SettingsComponent view={view} />
        <EntryViewComponent view={view} outerSpecData={specData} />
    </EntryProvider>
);

export default EntryViewEntry;
