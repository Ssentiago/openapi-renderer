import Dexie from 'dexie';
import { Database, EntryViewData } from '../typing/interfaces';
import { BaseSpecification } from './specification';

export class IndexedDB extends Dexie implements Database {
    spec: Dexie.Table<BaseSpecification, number>;

    constructor() {
        super('OpenAPI Renderer');

        this.version(1).stores({
            spec: '++id, &[path+name+diff+version], createdAt, softDeleted',
        });
        this.spec = this.table('spec');

        this.spec.mapToClass(BaseSpecification);
    }

    async add(spec: BaseSpecification): Promise<void> {
        await this.spec.add(spec);
    }

    async getVersions(path: string): Promise<BaseSpecification[]> {
        let versions = await this.spec.where('path').equals(path).toArray();
        versions = versions.sort(
            (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
        );
        return versions;
    }

    async getLastVersion(path: string): Promise<BaseSpecification | undefined> {
        const versions = await this.getVersions(path);
        return versions.at(-1);
    }

    async deleteVersion(id: number): Promise<void> {
        const spec = await this.spec.get(id);
        if (spec) {
            spec.softDeleted = true;
            await this.spec.put(spec);
        }
    }

    async restoreVersion(id: number): Promise<void> {
        const spec = await this.spec.get(id);
        if (spec) {
            spec.softDeleted = false;
            await this.spec.put(spec);
        }
    }

    async deleteVersionPermanently(id: number): Promise<void> {
        await this.spec.delete(id);
    }

    async isNextVersionFull(path: string): Promise<boolean> {
        const count = await this.spec.where('path').equals(path).count();
        return count % 10 === 0;
    }

    async getEntryViewData(): Promise<EntryViewData> {
        const data: EntryViewData = {};

        await this.spec.toCollection().each((record) => {
            const path = record.path;
            const time = new Date(record.createdAt).getTime();
            if (!data[path]) {
                data[path] = {
                    count: 1,
                    lastUpdate: time,
                };
            } else {
                data[path].count++;
                data[path].lastUpdate =
                    time > data[path].lastUpdate ? time : data[path].lastUpdate;
            }
        });

        return data;
    }

    async getAllData(): Promise<Array<BaseSpecification>> {
        return this.spec.toArray();
    }

    async renameFile(oldPath: string, newPath: string): Promise<void> {
        const versions = await this.getVersions(oldPath);
        const updatedVersions = versions.map((version) => ({
            ...version,
            path: newPath,
        }));
        await this.spec.bulkPut(updatedVersions);
    }

    async isFileTracked(path: string): Promise<boolean> {
        const spec = await this.spec.where('path').equals(path).first();
        return !!spec;
    }

    async deleteFile(path: string): Promise<void> {
        await this.spec.where('path').equals(path).delete();
    }

    async removeAllVersions(path: string): Promise<void> {
        await this.spec
            .where('path')
            .equals(path)
            .modify((record) => (record.softDeleted = true));
    }

    async clearAll(): Promise<void> {
        await this.spec
            .toCollection()
            .modify((record) => (record.softDeleted = true));
    }

    async restoreAll(): Promise<void> {
        await this.spec
            .toCollection()
            .modify((record) => (record.softDeleted = false));
    }

    async permanentlyClearAll(): Promise<void> {
        await this.spec
            .filter((record) => Boolean(record.softDeleted))
            .delete();
    }
}
