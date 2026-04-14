import { type TemplateResult } from "lit";
import type { AssetDocument } from "../../types/index.js";
import { PublishingElement } from "../../internal/ui.js";
export interface PublishingMediaUploadItem {
    readonly id: string;
    readonly file: File;
    readonly previewUrl?: string;
}
export interface PublishingMediaUploadDetail {
    readonly files: readonly PublishingMediaUploadItem[];
}
export interface PublishingMediaRemoveDetail {
    readonly asset: AssetDocument;
}
export declare class KitPublishingMediaUpload extends PublishingElement {
    assets: readonly AssetDocument[];
    accept: string;
    disabled: boolean;
    uploadLabel: string;
    emptyLabel: string;
    private activeDrop;
    private pendingUploads;
    static styles: import("lit").CSSResult[];
    protected renderContent(): TemplateResult;
    private renderAssetCard;
    private renderPendingCard;
    private handleFileInputChange;
    private handleDrop;
    private handleDragEnter;
    private handleDragOver;
    private handleDragLeave;
    private emitRemove;
}
export declare function readFileAsDataUrl(file: File): Promise<string>;
declare global {
    interface HTMLElementTagNameMap {
        "kit-publishing-media-upload": KitPublishingMediaUpload;
    }
}
