import { EventRef, Events, WorkspaceLeaf } from 'obsidian';
import { eventID } from './constants';

export interface OpenAPIRendererEvent {
    eventID: eventID;
    timestamp: Date;
    emitter: Events;
}

export interface SettingsTabStateEvent extends OpenAPIRendererEvent {}

export interface PowerOffEvent extends OpenAPIRendererEvent {}

export interface EditorChangedEvent extends OpenAPIRendererEvent {
    data: {
        leaf: WorkspaceLeaf;
    };
}

export interface SourceThemeStateEvent extends OpenAPIRendererEvent {}

export interface OpenAPIPreviewThemeStateEvent extends OpenAPIRendererEvent {}

export interface SwitchModeStateEvent extends OpenAPIRendererEvent {
    data: {
        leaf: WorkspaceLeaf;
    };
}

export interface ReloadOpenAPIEntryStateEvent extends OpenAPIRendererEvent {}

export interface ChangeGridColumnsStateEvent extends OpenAPIRendererEvent {
    data: {
        value: number;
    };
}

export interface UpdateOpenAPIViewStateEvent extends OpenAPIRendererEvent {
    data: {
        file: string;
    };
}

export interface ObserverEventData {
    emitter: Events;
    eventRef: EventRef;
}
