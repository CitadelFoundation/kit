/**
 * Route manifest helpers for publishing content.
 *
 * @module @citadelfoundation/kit-publishing/content/routes
 */
import type { Result } from "../internal/result.js";
import type { DocPageDocument, DocSectionDocument, HomepageDocument, PostDocument, PublishingRouteManifest, PublishingValidationIssue } from "../types/index.js";
/**
 * Normalize a slug into a route-safe relative path.
 */
export declare function normalizePublishingSlug(value: string): string;
/**
 * Create a stable slug from a human-facing title or phrase.
 */
export declare function slugifyPublishingValue(value: string): string;
/**
 * Build the route manifest and docs tree for canonical publishing content.
 */
export declare function buildPublishingRouteManifest(input: {
    homepage: HomepageDocument;
    posts: readonly PostDocument[];
    docSections: readonly DocSectionDocument[];
    docPages: readonly DocPageDocument[];
}): Result<PublishingRouteManifest, readonly PublishingValidationIssue[]>;
