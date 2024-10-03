import pako from 'pako';
import { DiffController } from '../../view/OpenAPI Version/controllers/diff-controller';
import { SpecParams } from '../typing/interfaces';

export class BaseSpecification {
    id: number;
    path: string;
    name: string;
    diff: string | Uint8Array;
    version: string;
    createdAt: string;
    softDeleted = false;
    isFull: boolean;

    constructor({
        id,
        path,
        name,
        diff,
        version,
        createdAt,
        softDeleted,
        isFull,
    }: SpecParams) {
        this.id = id;
        this.path = path;
        this.name = name;
        this.diff = diff;
        this.version = version;
        this.createdAt = createdAt;
        this.softDeleted = softDeleted;
        this.isFull = isFull;
    }
}

export class Specification extends BaseSpecification {
    diffController: DiffController;

    constructor({
        id,
        path,
        name,
        diff,
        version,
        createdAt,
        softDeleted,
        isFull,
    }: SpecParams) {
        super({
            id,
            path,
            name,
            diff,
            version,
            createdAt,
            softDeleted,
            isFull,
        });
        this.diffController = new DiffController();
    }

    getPatchedVersion(versions: Array<Specification>): Specification {
        const myIndex = versions.indexOf(this);

        if (myIndex === -1 || myIndex === 0) {
            const newSpec = {
                ...this,
                diff: pako.ungzip(this.diff as Uint8Array, { to: 'string' }),
            };
            return new Specification(newSpec);
        }

        const versionsBefore = [...versions].slice(0, myIndex + 1).reverse();

        const nearestFullIndex = versionsBefore.findIndex(
            (spec) => spec.isFull
        );
        const startIndex =
            nearestFullIndex === -1
                ? versionsBefore.length - 1
                : nearestFullIndex;

        let oldDiff: any = JSON.parse(
            pako.ungzip(versionsBefore[startIndex].diff as Uint8Array, {
                to: 'string',
            })
        );

        for (let i = startIndex - 1; i >= 0; i--) {
            const newDiff = JSON.parse(
                pako.ungzip(versionsBefore[i].diff as Uint8Array, {
                    to: 'string',
                })
            );
            oldDiff = this.diffController.patch(oldDiff, newDiff);
        }

        return new Specification({
            id: this.id,
            path: this.path,
            name: this.name,
            diff: JSON.stringify(oldDiff),
            version: this.version,
            createdAt: this.createdAt,
            softDeleted: this.softDeleted,
            isFull: this.isFull,
        });
    }
}
