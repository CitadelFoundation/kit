import { type TemplateResult } from "lit";
import { PublishingElement } from "../../internal/ui.js";
import { type LexicalContentMigrationResult } from "../../content/content_migration.js";
export interface PublishingImportToolItem {
    readonly id: string;
    readonly file: File;
    readonly result: LexicalContentMigrationResult;
}
export interface PublishingImportToolsImportDetail {
    readonly items: readonly PublishingImportToolItem[];
}
export interface PublishingImportToolsSelectionDetail {
    readonly files: readonly File[];
}
export declare class KitPublishingImportTools extends PublishingElement {
    accept: string;
    disabled: boolean;
    title: string;
    emptyLabel: string;
    private queue;
    private busy;
    static styles: import("lit").CSSResult[];
    protected renderContent(): TemplateResult;
    private renderQueueItem;
    private handleInputChange;
    queueMarkdownFiles(files: readonly File[]): Promise<void>;
    private handleImportAll;
    private clearQueue;
    private removeQueueItem;
}
declare global {
    interface HTMLElementTagNameMap {
        "kit-publishing-import-tools": KitPublishingImportTools;
    }
}
