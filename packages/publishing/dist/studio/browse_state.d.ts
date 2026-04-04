import type { PublishingIndexEntry } from "../types/index.js";
export type PublishingStudioPostsBucket = "draft" | "published" | "scheduled";
export declare const DEFAULT_PUBLISHING_STUDIO_POSTS_BUCKET: PublishingStudioPostsBucket;
export declare function isPublishingStudioPostsBucket(value: string): value is PublishingStudioPostsBucket;
export declare function publishingStudioPostsBucketForEntry(entry: Pick<PublishingIndexEntry, "publishedAt" | "status">, now?: number): PublishingStudioPostsBucket;
