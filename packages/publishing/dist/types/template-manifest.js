/**
 * Template manifest contract for publishing workspaces.
 *
 * @module @citadelfoundation/kit-publishing/types/template-manifest
 */
const APPROVED_PAGE_KINDS = new Set([
    "home",
    "docs-index",
    "docs-page",
    "blog-index",
    "blog-post",
]);
/**
 * Define and validate a template manifest.
 *
 * Validates that `pageKinds` only contains approved values, deduplicates
 * all kind arrays, and returns a deeply frozen manifest object.
 *
 * @throws When `id` or `version` is empty, `pageKinds` is empty,
 *   or `pageKinds` contains unapproved values.
 */
export function definePublishingTemplate(manifest) {
    if (!manifest.id || typeof manifest.id !== "string") {
        throw new Error("Template manifest id must be a non-empty string.");
    }
    if (!manifest.version || typeof manifest.version !== "string") {
        throw new Error("Template manifest version must be a non-empty string.");
    }
    const deduplicatedPageKinds = deduplicate(manifest.pageKinds);
    if (deduplicatedPageKinds.length === 0) {
        throw new Error("Template manifest must declare at least one page kind.");
    }
    for (const kind of manifest.pageKinds) {
        if (!APPROVED_PAGE_KINDS.has(kind)) {
            throw new Error(`Unapproved template page kind: "${kind}". ` +
                `Approved kinds: ${[...APPROVED_PAGE_KINDS].join(", ")}`);
        }
    }
    const frozen = Object.freeze({
        id: manifest.id,
        label: manifest.label,
        version: manifest.version,
        pageKinds: Object.freeze([...deduplicatedPageKinds]),
        sectionKinds: Object.freeze([...deduplicate(manifest.sectionKinds)]),
        blockKinds: Object.freeze([...deduplicate(manifest.blockKinds)]),
        defaultSiteMetadata: manifest.defaultSiteMetadata,
        defaultContent: manifest.defaultContent,
    });
    return frozen;
}
function deduplicate(items) {
    return [...new Set(items)];
}
