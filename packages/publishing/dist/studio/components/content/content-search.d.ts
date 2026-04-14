import { type TemplateResult } from "lit";
import "@citadelfoundation/kit-ui/components/input";
import { PublishingElement } from "../../../internal/ui.js";
export interface PublishingContentSearchItem {
    readonly id: string;
    readonly title: string;
    readonly content: string;
    readonly tags: readonly string[];
}
export interface PublishingContentSearchChangeDetail {
    readonly query: string;
    readonly results: readonly PublishingContentSearchItem[];
}
export declare class KitPublishingContentSearch extends PublishingElement {
    items: readonly PublishingContentSearchItem[];
    query: string;
    debounceMs: number;
    private draftQuery;
    private debounceTimer;
    private readonly searchInput?;
    static styles: import("lit").CSSResult[];
    connectedCallback(): void;
    disconnectedCallback(): void;
    protected renderContent(): TemplateResult;
    private readonly handleSearchInput;
    private readonly clearSearch;
    private scheduleSearchCommit;
    private clearDebounceTimer;
    private emitSearchChange;
    private filteredItems;
    private renderExcerpt;
    private renderHighlightedText;
    private renderHighlightedSegments;
}
