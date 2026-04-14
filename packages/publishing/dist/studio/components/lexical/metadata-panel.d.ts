import type { PropertyValues, TemplateResult } from "lit";
import { PublishingElement } from "../../../internal/ui.js";
export interface PublishingMetadataSnapshot {
    readonly seoTitle: string;
    readonly seoDescription: string;
    readonly excerpt: string;
    readonly slug: string;
    readonly tags: readonly string[];
}
export interface PublishingMetadataIssue {
    readonly field: keyof Omit<PublishingMetadataSnapshot, "tags"> | "tags";
    readonly message: string;
}
export interface PublishingMetadataChangeDetail {
    readonly metadata: PublishingMetadataSnapshot;
    readonly issues: readonly PublishingMetadataIssue[];
    readonly isValid: boolean;
}
export declare class KitPublishingMetadataPanel extends PublishingElement {
    seoTitle: string;
    seoDescription: string;
    excerpt: string;
    slug: string;
    tags: string;
    open: boolean;
    private revision;
    static styles: import("lit").CSSResult[];
    protected updated(changedProperties: PropertyValues<this>): void;
    getMetadata(): PublishingMetadataSnapshot;
    getValidationIssues(): readonly PublishingMetadataIssue[];
    protected render(): TemplateResult;
    private handleSeoTitleInput;
    private handleSeoDescriptionInput;
    private handleExcerptInput;
    private handleSlugInput;
    private handleTagsInput;
    private readInputValue;
    private readTextareaValue;
    private dispatchMetadataChange;
    private buildValidationIssues;
    private getParsedTags;
}
