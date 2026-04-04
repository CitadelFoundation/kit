/**
 * Runtime composition for the local publishing server.
 *
 * @module @citadelfoundation/kit-publishing/server/runtime
 */
import { createLogger } from "../internal/logger.js";
import { createFileContentRepository, createPublishingPaths, } from "../content/file_content_repository.js";
import { normalizePublishingSlug, slugifyPublishingValue, } from "../content/routes.js";
import { renderPlaintextPreview, } from "../content/frontmatter.js";
import { createPublishingIndexDatabase, } from "./index_database.js";
const logger = createLogger("kit-publishing-runtime");
/**
 * Create the cooper-backed publishing runtime for a workspace root.
 */
export async function createPublishingRuntime(options) {
    const paths = createPublishingPaths(options.root, options.paths);
    const repository = createFileContentRepository(paths);
    await repository.ensureWorkspace();
    const index = createPublishingIndexDatabase(paths.indexDatabasePath);
    const contentService = {
        paths,
        async getSnapshot() {
            return repository.readSnapshot();
        },
        async saveDraft(draftId, document, sourcePath, operation) {
            return repository.saveDraft(draftId, {
                document,
                sourcePath,
                operation: operation ?? "upsert",
            });
        },
        async getDraft(draftId) {
            return repository.readDraft(draftId);
        },
    };
    const previewService = {
        render(document) {
            const route = routeForDocument(document);
            const title = titleForDocument(document);
            const excerpt = createExcerpt(previewSourceForDocument(document));
            const html = document.kind === "post" ||
                document.kind === "page" ||
                document.kind === "doc_page"
                ? renderPlaintextPreview(document.body)
                : renderPlaintextPreview(excerpt);
            return { title, route, excerpt, html };
        },
    };
    const indexService = {
        rebuild(entries) {
            index.rebuild(entries);
        },
        listAll() {
            return index.listAll();
        },
        search(query, limit) {
            return index.search(query, limit);
        },
    };
    const aiService = {
        suggest(request) {
            switch (request.action) {
                case "suggest_excerpt":
                    return {
                        action: request.action,
                        content: createExcerpt(request.text ?? request.title ?? ""),
                        rationale: "Generated a short excerpt from the current draft body.",
                    };
                case "suggest_slug":
                    return {
                        action: request.action,
                        content: slugifyPublishingValue(request.title ?? request.text ?? "draft"),
                        rationale: "Generated a route-safe slug from the current title.",
                    };
                case "suggest_links": {
                    const candidates = index
                        .search(request.text ?? request.title ?? "", request.limit ?? 5)
                        .filter((entry) => entry.route !== request.currentRoute)
                        .map((entry) => entry.route);
                    return {
                        action: request.action,
                        content: candidates,
                        rationale: "Suggested local internal links from the current indexed content set.",
                    };
                }
            }
        },
    };
    const runtime = {
        paths,
        index,
        content() {
            return contentService;
        },
        preview() {
            return previewService;
        },
        publish() {
            return publishService;
        },
        ai() {
            return aiService;
        },
        search() {
            return indexService;
        },
        async refreshIndex() {
            const snapshot = await repository.readSnapshot();
            if (!snapshot.success) {
                return snapshot;
            }
            index.rebuild(snapshot.value.routes.entries);
            return { success: true, value: snapshot.value.routes.entries };
        },
        async dispose() {
            index.dispose();
        },
    };
    const publishService = {
        async validateDraft(draftId) {
            return repository.renderDraftDiff(draftId);
        },
        async applyDraft(draftId) {
            const applied = await repository.applyDraft(draftId);
            if (!applied.success) {
                return applied;
            }
            const refreshed = await runtime.refreshIndex();
            if (!refreshed.success) {
                return {
                    success: false,
                    error: refreshed.error,
                };
            }
            return applied;
        },
    };
    const seeded = await runtime.refreshIndex();
    if (!seeded.success) {
        await runtime.dispose();
        return { success: false, error: seeded.error };
    }
    logger.info("Publishing runtime initialized", {
        root: paths.root,
        indexedEntries: seeded.value.length,
    });
    return { success: true, value: runtime };
}
function routeForDocument(document) {
    switch (document.kind) {
        case "site_settings":
        case "homepage":
        case "navigation":
            return "/";
        case "tag":
            return `/__studio/tags/${normalizePublishingSlug(document.slug)}`;
        case "post":
            return `/blog/${normalizePublishingSlug(document.slug)}`;
        case "page":
            return `/__studio/pages/${normalizePublishingSlug(document.slug)}`;
        case "doc_page":
            return `/docs/${normalizePublishingSlug(document.slug)}`;
        case "doc_section":
            return `/docs#${normalizePublishingSlug(document.slug)}`;
        case "asset":
            return `/${document.path.replace(/^\/+/, "")}`;
    }
}
function createExcerpt(value) {
    const words = value.trim().split(/\s+/).filter(Boolean).slice(0, 28);
    return words.join(" ");
}
function titleForDocument(document) {
    switch (document.kind) {
        case "site_settings":
            return document.title;
        case "homepage":
            return document.seo?.title ?? document.heroTitle;
        case "navigation":
            return "Navigation";
        case "tag":
            return document.seo?.title ?? document.label;
        case "doc_section":
            return document.title;
        case "asset":
            return document.label;
        default:
            return document.title;
    }
}
function previewSourceForDocument(document) {
    switch (document.kind) {
        case "site_settings":
            return `${document.description}\n\n${document.footerNotice}`;
        case "navigation":
            return [...document.mainLinks, ...document.footerLinks]
                .map((item) => item.label)
                .join(", ");
        case "homepage":
            return `${document.heroTitle}\n\n${document.heroBody}`;
        case "tag":
            return document.description ?? document.label;
        case "post":
            return document.excerpt.length > 0 ? document.excerpt : document.body;
        case "page":
            return document.excerpt.length > 0 ? document.excerpt : document.body;
        case "doc_page":
            return document.summary.length > 0 ? document.summary : document.body;
        case "doc_section":
            return document.description ?? document.title;
        case "asset":
            return document.path;
    }
}
