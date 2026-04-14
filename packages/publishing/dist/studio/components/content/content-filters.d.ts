/**
 * Publishing collection filter controls.
 *
 * @module @citadelfoundation/kit-publishing/studio/components/content/content-filters
 */
import type { TemplateResult } from "lit";
import "@citadelfoundation/kit-ui/components/input";
import "@citadelfoundation/kit-ui/components/select";
export type CollectionFilterOption = {
    readonly value: string;
    readonly label: string;
};
export type CollectionFilterConfig = {
    readonly activeValue: string;
    readonly options: readonly CollectionFilterOption[];
    readonly disabled?: boolean;
    readonly onChange?: (value: string) => void;
};
export type CollectionSearchConfig = {
    readonly label: string;
    readonly value: string;
    readonly placeholder: string;
    readonly helperText?: string;
    readonly onChange?: (value: string) => void;
};
export declare function renderCollectionSearchInput(config: CollectionSearchConfig): TemplateResult;
export declare function renderCollectionFilterChip(config: {
    readonly label: string;
    readonly value: string;
    readonly options: readonly CollectionFilterOption[];
    readonly prefix?: string;
    readonly disabled?: boolean;
    readonly onChange?: (value: string) => void;
}): TemplateResult;
export declare function renderCollectionSortSelect(config: {
    readonly label: string;
    readonly value: string;
    readonly options: readonly CollectionFilterOption[];
    readonly disabled?: boolean;
    readonly onChange?: (value: string) => void;
}): TemplateResult;
