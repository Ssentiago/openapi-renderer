import React, { useEffect } from 'react';
import { eventID } from '../../../../events-management/typing/constants';
import { ChangeGridColumnsStateEvent } from '../../../../events-management/typing/interfaces';
import { OpenAPIEntryView } from '../../OpenAPI-entry-view';
import { useEntryContext } from '../core/context';

export const SettingsComponent: React.FC<{
    view: OpenAPIEntryView;
}> = ({ view }) => {
    const { columnValue, setColumnValue } = useEntryContext();

    useEffect(() => {
        setColumnValue(view.plugin.settings.OpenAPIEntryGridLayoutColumns);
        view.plugin.observer.subscribe(
            view.app.workspace,
            eventID.ChangeGridColumnsState,
            async (event) => {
                const changeGridEvent = event as ChangeGridColumnsStateEvent;
                setColumnValue(changeGridEvent.data.value);
            }
        );
    }, []);

    return null;
};
