/**
 * SQLite-backed local search index for publishing content.
 *
 * @module @citadelfoundation/kit-publishing/server/index_database
 */
import type { Disposable } from "../internal/result.js";
import type { PublishingIndexEntry } from "../types/index.js";
/**
 * Local index contract used by the studio and AI suggestion helpers.
 */
export interface PublishingIndexDatabase extends Disposable {
    /**
     * Replace the current index with the provided entries.
     */
    rebuild(entries: readonly PublishingIndexEntry[]): void;
    /**
     * Search the local index using a lightweight title/description match.
     */
    search(query: string, limit?: number): readonly PublishingIndexEntry[];
    /**
     * List every indexed entry in stable route order.
     */
    listAll(): readonly PublishingIndexEntry[];
}
/**
 * Create the local publishing index database.
 */
export declare function createPublishingIndexDatabase(path: string): PublishingIndexDatabase;
