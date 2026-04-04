/**
 * Runtime composition for the local publishing server.
 *
 * @module @citadelfoundation/kit-publishing/server/runtime
 */
import type { Result } from "../internal/result.js";
import type { PublishingDraftOperation, PublishingAiAction, PublishingAiSuggestion, PublishingDiff, PublishingDocument, PublishingError, PublishingIndexEntry, PublishingPaths, PublishingPreview, PublishingRepositorySnapshot } from "../types/index.js";
import { type PublishingIndexDatabase } from "./index_database.js";
/**
 * Request payload for local AI assist endpoints.
 */
export interface PublishingAiRequest {
    readonly action: PublishingAiAction;
    readonly title?: string;
    readonly text?: string;
    readonly currentRoute?: string;
    readonly limit?: number;
}
/**
 * Content service API exposed through the publishing runtime.
 */
export interface PublishingContentService {
    readonly paths: PublishingPaths;
    getSnapshot(): Promise<Result<PublishingRepositorySnapshot, PublishingError>>;
    saveDraft(draftId: string, document: PublishingDocument, sourcePath?: string, operation?: PublishingDraftOperation): Promise<Result<unknown, PublishingError>>;
    getDraft(draftId: string): Promise<Result<unknown, PublishingError>>;
}
/**
 * Preview service API exposed through the publishing runtime.
 */
export interface PublishingPreviewService {
    render(document: PublishingDocument): PublishingPreview;
}
/**
 * Publish service API exposed through the publishing runtime.
 */
export interface PublishingPublishService {
    validateDraft(draftId: string): Promise<Result<readonly PublishingDiff[], PublishingError>>;
    applyDraft(draftId: string): Promise<Result<readonly PublishingDiff[], PublishingError>>;
}
/**
 * AI suggestion service API exposed through the publishing runtime.
 */
export interface PublishingAiService {
    suggest(request: PublishingAiRequest): PublishingAiSuggestion;
}
/**
 * Local index service exposed through the publishing runtime.
 */
export interface PublishingIndexService {
    rebuild(entries: readonly PublishingIndexEntry[]): void;
    listAll(): readonly PublishingIndexEntry[];
    search(query: string, limit?: number): readonly PublishingIndexEntry[];
}
/**
 * Aggregated runtime used by the server factory.
 */
export interface PublishingRuntime {
    readonly paths: PublishingPaths;
    readonly index: PublishingIndexDatabase;
    content(): PublishingContentService;
    preview(): PublishingPreviewService;
    publish(): PublishingPublishService;
    ai(): PublishingAiService;
    search(): PublishingIndexService;
    refreshIndex(): Promise<Result<readonly PublishingIndexEntry[], PublishingError>>;
    dispose(): Promise<void>;
}
/**
 * Create the cooper-backed publishing runtime for a workspace root.
 */
export declare function createPublishingRuntime(options: {
    readonly root: string;
    readonly paths?: Partial<PublishingPaths>;
}): Promise<Result<PublishingRuntime, PublishingError>>;
