import { nothing, type TemplateResult } from "lit";
import type { TableColumn } from "@citadelfoundation/kit-ui/components/table";
import { PublishingElement } from "../../../internal/ui.js";
import type { PublishingIndexEntry } from "../../../types/index.js";
export interface PublishingContentListEmptyState {
    readonly kind: "filtered" | "unfiltered";
    readonly title: string;
    readonly message: string;
    readonly actionLabel?: string;
    readonly onAction?: () => void;
}
export interface PublishingContentListRow {
    readonly entry: PublishingIndexEntry;
    readonly title: string;
    readonly status: PublishingContentListStatus;
    readonly author: string;
    readonly publishedAt: string;
}
type PublishingContentListStatus = "draft" | "published" | "scheduled";
export declare class KitPublishingContentList extends PublishingElement {
    entries: readonly PublishingIndexEntry[];
    emptyState: PublishingContentListEmptyState | null;
    onEditEntry: ((entry: PublishingIndexEntry) => void) | null;
    onPreviewEntry: ((entry: PublishingIndexEntry) => void) | null;
    onDuplicateEntry: ((entry: PublishingIndexEntry) => void) | null;
    canEditEntry: ((entry: PublishingIndexEntry) => boolean) | null;
    canPreviewEntry: ((entry: PublishingIndexEntry) => boolean) | null;
    canDuplicateEntry: ((entry: PublishingIndexEntry) => boolean) | null;
    busy: boolean;
    caption: string;
    selectedRoute: string;
    static styles: import("lit").CSSResult[];
    protected renderContent(): TemplateResult | typeof nothing;
    private get rows();
    private renderEmptyState;
    private handleRowClick;
    private handleRowKeyDown;
    private renderStatusBadge;
    private renderDateLabel;
    private renderActions;
}
declare global {
    interface HTMLElementTagNameMap {
        "kit-publishing-content-list": KitPublishingContentList;
    }
}
export declare function createPublishingContentListRows(entries: readonly PublishingIndexEntry[]): readonly PublishingContentListRow[];
export declare function createPublishingContentListColumns(handlers: {
    readonly renderStatusBadge: (status: PublishingContentListStatus) => TemplateResult;
    readonly renderDateLabel: (value: string, status: PublishingContentListStatus) => string;
    readonly renderActions: (entry: PublishingIndexEntry) => TemplateResult;
}): readonly TableColumn<PublishingContentListRow>[];
export declare function renderPublishingContentListEmptyState(emptyState: PublishingContentListEmptyState): TemplateResult;
export declare function labelForPublishingContentListStatus(status: PublishingContentListStatus): string;
export declare function renderPublishingContentListStatusBadge(status: PublishingContentListStatus): TemplateResult;
export {};
