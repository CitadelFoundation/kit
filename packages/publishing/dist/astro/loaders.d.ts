/**
 * Astro-facing content loaders for `@citadelfoundation/kit-publishing`.
 *
 * @module @citadelfoundation/kit-publishing/astro/loaders
 */
import type { Result } from "../internal/result.js";
import type { DocPageDocument, HomepageDocument, NavigationDocument, PostDocument, PublishingDocsTreeSection, PublishingError, PublishingPaths, PublishingRepositorySnapshot, SiteSettingsDocument } from "../types/index.js";
/**
 * Load the full publishing snapshot for an Astro project root.
 */
export declare function loadAstroPublishingSnapshot(rootOrPaths: string | PublishingPaths): Promise<Result<PublishingRepositorySnapshot, PublishingError>>;
/**
 * Load just the Astro homepage singleton.
 */
export declare function loadAstroHomepage(rootOrPaths: string | PublishingPaths): Promise<Result<HomepageDocument, PublishingError>>;
/**
 * Load just the Astro site settings singleton.
 */
export declare function loadAstroSiteSettings(rootOrPaths: string | PublishingPaths): Promise<Result<SiteSettingsDocument, PublishingError>>;
/**
 * Load the Astro navigation singleton.
 */
export declare function loadAstroNavigation(rootOrPaths: string | PublishingPaths): Promise<Result<NavigationDocument, PublishingError>>;
/**
 * Load the Astro post collection.
 */
export declare function loadAstroPosts(rootOrPaths: string | PublishingPaths): Promise<Result<readonly PostDocument[], PublishingError>>;
/**
 * Load docs pages for Astro route generation.
 */
export declare function loadAstroDocPages(rootOrPaths: string | PublishingPaths): Promise<Result<readonly DocPageDocument[], PublishingError>>;
/**
 * Load the docs tree for Astro docs navigation rendering.
 */
export declare function loadAstroDocsTree(rootOrPaths: string | PublishingPaths): Promise<Result<readonly PublishingDocsTreeSection[], PublishingError>>;
