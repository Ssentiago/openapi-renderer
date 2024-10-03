import { IconName, ItemView, WorkspaceLeaf } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import OpenAPIRendererPlugin from '../../core/openapi-renderer-plugin';
import { OPENAPI_ENTRY_VIEW_TYPE } from '../typing/types';
import EntryViewEntry from './components/entry-component';
import { EntryController } from './controllers/entry-controller';

export class OpenAPIEntryView extends ItemView {
    reactRoot: Root | undefined = undefined;
    controller: EntryController;

    constructor(
        leaf: WorkspaceLeaf,
        public plugin: OpenAPIRendererPlugin
    ) {
        super(leaf);
        this.controller = new EntryController(this);
    }

    getViewType(): string {
        return OPENAPI_ENTRY_VIEW_TYPE;
    }

    getDisplayText(): string {
        const vaultName = this.app.vault.getName();
        return `OpenAPI Entry View for vault: ${vaultName}`;
    }

    getIcon(): IconName {
        return 'file-search-2';
    }

    async onOpen(): Promise<void> {
        const { contentEl } = this;

        const data = await this.controller.getEntryViewData();

        // const data = [
        //     {
        //         path: 'user-management-v1.yaml',
        //         versionCount: 12,
        //         lastUpdatedAt: '2024-01-15T12:34:56Z',
        //     },
        //     {
        //         path: 'order-processing-v2.yaml',
        //         versionCount: 7,
        //         lastUpdatedAt: '2024-02-20T09:21:00Z',
        //     },
        //     {
        //         path: 'inventory-system-v3.yaml',
        //         versionCount: 5,
        //         lastUpdatedAt: '2024-03-10T15:30:00Z',
        //     },
        //     {
        //         path: 'payment-gateway-v1.yaml',
        //         versionCount: 9,
        //         lastUpdatedAt: '2024-04-05T11:45:00Z',
        //     },
        //     {
        //         path: 'shipping-tracking-v2.yaml',
        //         versionCount: 4,
        //         lastUpdatedAt: '2024-05-22T08:00:00Z',
        //     },
        //     {
        //         path: 'customer-support-v1.yaml',
        //         versionCount: 6,
        //         lastUpdatedAt: '2024-06-15T10:15:00Z',
        //     },
        //     {
        //         path: 'analytics-dashboard-v3.yaml',
        //         versionCount: 14,
        //         lastUpdatedAt: '2024-07-30T13:00:00Z',
        //     },
        //     {
        //         path: 'notification-system-v2.yaml',
        //         versionCount: 3,
        //         lastUpdatedAt: '2024-08-18T09:30:00Z',
        //     },
        //     {
        //         path: 'marketing-campaigns-v1.yaml',
        //         versionCount: 8,
        //         lastUpdatedAt: '2024-09-25T14:00:00Z',
        //     },
        //     {
        //         path: 'feedback-collection-v1.yaml',
        //         versionCount: 2,
        //         lastUpdatedAt: '2024-10-12T07:45:00Z',
        //     },
        //     {
        //         path: 'authorization-system-v4.yaml',
        //         versionCount: 11,
        //         lastUpdatedAt: '2024-11-01T16:00:00Z',
        //     },
        //     {
        //         path: 'data-import-v3.yaml',
        //         versionCount: 13,
        //         lastUpdatedAt: '2024-12-05T12:00:00Z',
        //     },
        //     {
        //         path: 'enterprise-integration-v2.yaml',
        //         versionCount: 10,
        //         lastUpdatedAt: '2024-01-28T11:00:00Z',
        //     },
        //     {
        //         path: 'real-time-updates-v1.yaml',
        //         versionCount: 6,
        //         lastUpdatedAt: '2024-02-14T09:00:00Z',
        //     },
        //     {
        //         path: 'user-feedback-v4.yaml',
        //         versionCount: 4,
        //         lastUpdatedAt: '2024-03-07T08:30:00Z',
        //     },
        //     {
        //         path: 'api-gateway-v1.yaml',
        //         versionCount: 7,
        //         lastUpdatedAt: '2024-04-22T14:45:00Z',
        //     },
        //     {
        //         path: 'data-export-v2.yaml',
        //         versionCount: 5,
        //         lastUpdatedAt: '2024-05-16T10:00:00Z',
        //     },
        //     {
        //         path: 'security-logs-v1.yaml',
        //         versionCount: 9,
        //         lastUpdatedAt: '2024-06-25T15:30:00Z',
        //     },
        //     {
        //         path: 'content-management-v3.yaml',
        //         versionCount: 8,
        //         lastUpdatedAt: '2024-07-12T12:00:00Z',
        //     },
        //     {
        //         path: 'incident-management-v1.yaml',
        //         versionCount: 2,
        //         lastUpdatedAt: '2024-08-04T11:15:00Z',
        //     },
        //     {
        //         path: 'user-roles-v2.yaml',
        //         versionCount: 6,
        //         lastUpdatedAt: '2024-09-03T09:45:00Z',
        //     },
        // ];

        const reactRoot = contentEl.createEl('div');
        this.reactRoot = createRoot(reactRoot);
        this.reactRoot.render(<EntryViewEntry view={this} specData={data} />);
    }

    async onClose(): Promise<void> {
        if (this.reactRoot) {
            this.reactRoot.unmount();
        }
    }
}
