/**
 * Astro-facing content loaders for `@citadelfoundation/kit-publishing`.
 *
 * @module @citadelfoundation/kit-publishing/astro/loaders
 */
import { createFileContentRepository, createPublishingPaths, } from "../content/file_content_repository.js";
/**
 * Load the full publishing snapshot for an Astro project root.
 */
export async function loadAstroPublishingSnapshot(rootOrPaths) {
    const paths = typeof rootOrPaths === "string"
        ? createPublishingPaths(rootOrPaths)
        : rootOrPaths;
    return createFileContentRepository(paths).readSnapshot();
}
/**
 * Load just the Astro homepage singleton.
 */
export async function loadAstroHomepage(rootOrPaths) {
    const snapshot = await loadAstroPublishingSnapshot(rootOrPaths);
    if (!snapshot.success) {
        return { success: false, error: snapshot.error };
    }
    return { success: true, value: snapshot.value.homepage };
}
/**
 * Load just the Astro site settings singleton.
 */
export async function loadAstroSiteSettings(rootOrPaths) {
    const snapshot = await loadAstroPublishingSnapshot(rootOrPaths);
    if (!snapshot.success) {
        return { success: false, error: snapshot.error };
    }
    return { success: true, value: snapshot.value.siteSettings };
}
/**
 * Load the Astro navigation singleton.
 */
export async function loadAstroNavigation(rootOrPaths) {
    const snapshot = await loadAstroPublishingSnapshot(rootOrPaths);
    if (!snapshot.success) {
        return { success: false, error: snapshot.error };
    }
    return { success: true, value: snapshot.value.navigation };
}
/**
 * Load the Astro post collection.
 */
export async function loadAstroPosts(rootOrPaths) {
    const snapshot = await loadAstroPublishingSnapshot(rootOrPaths);
    if (!snapshot.success) {
        return { success: false, error: snapshot.error };
    }
    return { success: true, value: snapshot.value.posts };
}
/**
 * Load docs pages for Astro route generation.
 */
export async function loadAstroDocPages(rootOrPaths) {
    const snapshot = await loadAstroPublishingSnapshot(rootOrPaths);
    if (!snapshot.success) {
        return { success: false, error: snapshot.error };
    }
    return { success: true, value: snapshot.value.docPages };
}
/**
 * Load the docs tree for Astro docs navigation rendering.
 */
export async function loadAstroDocsTree(rootOrPaths) {
    const snapshot = await loadAstroPublishingSnapshot(rootOrPaths);
    if (!snapshot.success) {
        return { success: false, error: snapshot.error };
    }
    return { success: true, value: snapshot.value.routes.docsTree };
}
