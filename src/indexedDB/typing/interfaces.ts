import Dexie from 'dexie';
import { BaseSpecification } from '../database/specification';

export interface Database extends Dexie {
    spec: Dexie.Table<BaseSpecification, number>;
}

export interface SpecParams {
    id: number;
    path: string;
    name: string;
    diff: string | Uint8Array;
    version: string;
    createdAt: string;
    softDeleted: boolean;
    isFull: boolean;
}

export enum MessageType {
    AddVersion = 'add-version',
    GetVersions = 'get-versions',
    GetLastVersion = 'get-last-version',
    DeleteVersion = 'delete-version',
    RestoreVersion = 'restore-version',
    DeletePermanently = 'delete-version-permanently',
    IsNextVersionFull = 'is-next-version-full',
    GetEntryViewData = 'get-entry-view-data',
    GetAllData = 'get-all-data',
    RenameFile = 'rename-file',
    IsFileTracked = 'is-file-tracked',
    DeleteFile = 'delete-file',
}

export const enum ResponseType {
    Success = 'SUCCESS',
    Error = 'ERROR',
}

interface Payload {
    data: any;
}

export interface WorkerMessage {
    id?: number;
    type: MessageType;
    payload: Payload;
}

export interface WorkerResponse {
    id?: number;
    type: ResponseType;
    payload: Payload;
}

export interface EntryViewData {
    [key: string]: {
        lastUpdate: number;
        count: number;
    };
}
