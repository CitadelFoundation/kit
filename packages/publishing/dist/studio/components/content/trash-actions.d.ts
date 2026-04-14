/**
 * Trash/archive actions for publishing content.
 *
 * @module @citadelfoundation/kit-publishing/studio/components/content/trash-actions
 */
import { type TemplateResult } from "lit";
import "@citadelfoundation/kit-ui/components/dialog";
import "@citadelfoundation/kit-ui/components/select";
import "@citadelfoundation/kit-ui/components/tabs";
import { PublishingElement } from "../../../internal/ui.js";
export type PublishingTrashView = "active" | "archive" | "trash";
export type PublishingTrashAction = "trash" | "archive" | "restore" | "delete";
export type PublishingTrashItemStatus = "draft" | "published" | "archived" | "trashed";
export interface PublishingTrashItem {
    readonly id: string;
    readonly title: string;
    readonly kind: string;
    readonly status: PublishingTrashItemStatus;
    readonly restoreStatus?: Exclude<PublishingTrashItemStatus, "archived" | "trashed">;
}
export interface PublishingTrashActionDetail {
    readonly action: PublishingTrashAction;
    readonly item: PublishingTrashItem;
    readonly nextStatus: PublishingTrashItemStatus | null;
    readonly view: PublishingTrashView;
}
export declare class KitPublishingTrashActions extends PublishingElement {
    items: readonly PublishingTrashItem[];
    view: PublishingTrashView;
    kindFilter: string;
    private confirmationState;
    static styles: import("lit").CSSResult[];
    protected renderContent(): TemplateResult;
    private renderItemRow;
    private renderActionButton;
    private renderConfirmationDialog;
    private confirmationTitle;
    private handleViewChange;
    private handleKindFilterChange;
    private getViewIndex;
    private getVisibleItems;
    private matchesView;
    private isActionAvailable;
    private openConfirmation;
    private closeConfirmation;
    private confirmAction;
}
export declare function labelForTrashAction(action: PublishingTrashAction): string;
export declare function nextStatusForTrashAction(action: PublishingTrashAction, item: PublishingTrashItem): PublishingTrashItemStatus | null;
export declare function confirmationBodyForTrashAction(action: PublishingTrashAction, item: PublishingTrashItem): string;
