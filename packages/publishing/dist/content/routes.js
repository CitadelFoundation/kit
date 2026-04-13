/**
 * Route manifest helpers for publishing content.
 *
 * @module @citadelfoundation/kit-publishing/content/routes
 */
/**
 * Normalize a slug into a route-safe relative path.
 */
export function normalizePublishingSlug(value) {
    return value
        .trim()
        .replace(/^\/+|\/+$/g, "")
        .replace(/\/{2,}/g, "/");
}
/**
 * Create a stable slug from a human-facing title or phrase.
 */
export function slugifyPublishingValue(value) {
    return normalizePublishingSlug(value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""));
}
/**
 * Build the route manifest and docs tree for canonical publishing content.
 */
export function buildPublishingRouteManifest(input) {
    const issues = [];
    const entries = [];
    const seenRoutes = new Map();
    const addEntry = (entry) => {
        const existing = seenRoutes.get(entry.route);
        if (existing) {
            issues.push({
                path: entry.route,
                message: `Route '${entry.route}' is already claimed by ${existing}.`,
            });
            return;
        }
        seenRoutes.set(entry.route, entry.kind);
        entries.push(entry);
    };
    addEntry({
        kind: "homepage",
        title: input.homepage.seo?.title ?? input.homepage.heroTitle,
        slug: "",
        route: "/",
        description: input.homepage.seo?.description ?? input.homepage.heroBody,
        access: "public",
        status: "published",
    });
    for (const post of input.posts) {
        const slug = normalizePublishingSlug(post.slug);
        addEntry({
            kind: "post",
            title: post.title,
            slug,
            route: `/blog/${slug}`,
            description: post.excerpt,
            access: post.access ?? "public",
            authorName: normalizeAuthorMetadata(post.author?.name),
            authorAvatarUrl: normalizeAuthorMetadata(post.author?.avatarUrl),
            tags: normalizePublishingTags(post.tags),
            status: post.status ?? "published",
            publishedAt: post.publishedAt,
        });
    }
    const sectionMap = new Map();
    for (const section of input.docSections) {
        sectionMap.set(section.id, section);
    }
    const unsectionedPages = [];
    const docsTree = new Map();
    const sortedSections = [...input.docSections].sort((left, right) => left.order - right.order || left.title.localeCompare(right.title));
    for (const section of sortedSections) {
        docsTree.set(section.id, {
            id: section.id,
            title: section.title,
            slug: normalizePublishingSlug(section.slug),
            description: section.description,
            order: section.order,
            pages: [],
        });
    }
    const sortedPages = [...input.docPages].sort((left, right) => left.order - right.order || left.title.localeCompare(right.title));
    for (const page of sortedPages) {
        const slug = normalizePublishingSlug(page.slug);
        const sectionTitle = page.sectionId
            ? sectionMap.get(page.sectionId)?.title
            : undefined;
        addEntry({
            kind: "doc_page",
            title: page.title,
            slug,
            route: `/docs/${slug}`,
            description: page.summary,
            access: page.access ?? "public",
            authorName: normalizeAuthorMetadata(page.author?.name),
            authorAvatarUrl: normalizeAuthorMetadata(page.author?.avatarUrl),
            tags: normalizePublishingTags(page.tags),
            status: page.status ?? "published",
            publishedAt: page.publishedAt,
            sectionTitle,
        });
        if (!page.sectionId) {
            unsectionedPages.push(page);
            continue;
        }
        const section = docsTree.get(page.sectionId);
        if (!section) {
            issues.push({
                path: `content/docs/pages/${slug}.mdx`,
                message: `Doc page references missing section '${page.sectionId}'.`,
            });
            continue;
        }
        docsTree.set(page.sectionId, {
            ...section,
            pages: [...section.pages, page],
        });
    }
    if (unsectionedPages.length > 0) {
        docsTree.set("__unsectioned__", {
            id: "__unsectioned__",
            title: "Unsectioned",
            slug: "unsectioned",
            order: Number.MAX_SAFE_INTEGER,
            pages: unsectionedPages,
        });
    }
    if (issues.length > 0) {
        return { success: false, error: issues };
    }
    const docsSections = [...docsTree.values()].sort((left, right) => left.order - right.order || left.title.localeCompare(right.title));
    return {
        success: true,
        value: {
            entries: entries.sort((left, right) => left.route.localeCompare(right.route)),
            docsTree: docsSections,
        },
    };
}
function normalizeAuthorMetadata(value) {
    const normalized = value?.trim();
    return normalized && normalized.length > 0 ? normalized : undefined;
}
function normalizePublishingTags(values) {
    if (!values) {
        return undefined;
    }
    const normalizedTags = [];
    const seen = new Set();
    for (const value of values) {
        const normalized = value.trim();
        if (normalized.length === 0) {
            continue;
        }
        const key = normalized.toLowerCase();
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        normalizedTags.push(normalized);
    }
    return normalizedTags.length > 0 ? normalizedTags : undefined;
}
