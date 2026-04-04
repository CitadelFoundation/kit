/**
 * File-backed repository for canonical publishing content and local drafts.
 *
 * @module @citadelfoundation/kit-publishing/content/file_content_repository
 */
import { createLogger } from "../internal/logger.js";
import { mkdir, readdir, readFile, rm, stat, writeFile, } from "node:fs/promises";
import { dirname, extname, join, relative } from "node:path";
import { parse as parseYaml } from "yaml";
import { parseFrontmatterDocument, serializeFrontmatterDocument, } from "./frontmatter.js";
import { buildPublishingRouteManifest, normalizePublishingSlug, slugifyPublishingValue, } from "./routes.js";
import { validatePublishingDocument } from "./schema.js";
const logger = createLogger("kit-publishing-repository");
/**
 * Create a resolved publishing workspace layout rooted at `root`.
 */
export function createPublishingPaths(root, overrides = {}) {
    const contentDir = overrides.contentDir ?? join(root, "content");
    const siteDir = overrides.siteDir ?? join(contentDir, "site");
    const tagsDir = overrides.tagsDir ?? join(contentDir, "tags");
    const postsDir = overrides.postsDir ?? join(contentDir, "posts");
    const pagesDir = overrides.pagesDir ?? join(contentDir, "pages");
    const docsDir = overrides.docsDir ?? join(contentDir, "docs");
    const docsPagesDir = overrides.docsPagesDir ?? join(docsDir, "pages");
    const docsSectionsDir = overrides.docsSectionsDir ?? join(docsDir, "sections");
    const mediaDir = overrides.mediaDir ?? join(contentDir, "media");
    const studioDir = overrides.studioDir ?? join(root, ".studio");
    const draftsDir = overrides.draftsDir ?? join(studioDir, "drafts");
    const indexDatabasePath = overrides.indexDatabasePath ?? join(studioDir, "publishing-index.sqlite");
    return {
        root,
        contentDir,
        siteDir,
        tagsDir,
        postsDir,
        pagesDir,
        docsDir,
        docsPagesDir,
        docsSectionsDir,
        mediaDir,
        studioDir,
        draftsDir,
        indexDatabasePath,
    };
}
/**
 * Create a file-backed publishing repository.
 */
export function createFileContentRepository(paths) {
    return new FileContentRepository(paths);
}
/**
 * File-backed publishing repository implementation.
 */
export class FileContentRepository {
    /**
     * Create a repository bound to a publishing workspace.
     */
    constructor(paths) {
        this.paths = paths;
    }
    /**
     * Ensure canonical directories and local draft directories exist.
     */
    async ensureWorkspace() {
        await Promise.all([
            mkdir(this.paths.siteDir, { recursive: true }),
            mkdir(this.paths.tagsDir, { recursive: true }),
            mkdir(this.paths.postsDir, { recursive: true }),
            mkdir(this.paths.pagesDir, { recursive: true }),
            mkdir(this.paths.docsPagesDir, { recursive: true }),
            mkdir(this.paths.docsSectionsDir, { recursive: true }),
            mkdir(this.paths.mediaDir, { recursive: true }),
            mkdir(this.paths.draftsDir, { recursive: true }),
        ]);
    }
    /**
     * Load the complete repository snapshot from disk.
     */
    async readSnapshot() {
        const siteSettings = await this.readSiteSettings();
        if (!siteSettings.success) {
            return { success: false, error: siteSettings.error };
        }
        const navigation = await this.readNavigation();
        if (!navigation.success) {
            return { success: false, error: navigation.error };
        }
        const homepage = await this.readHomepage();
        if (!homepage.success) {
            return { success: false, error: homepage.error };
        }
        const posts = await this.readPosts();
        if (!posts.success) {
            return { success: false, error: posts.error };
        }
        const pages = await this.readPages();
        if (!pages.success) {
            return { success: false, error: pages.error };
        }
        const tags = await this.readTags();
        if (!tags.success) {
            return { success: false, error: tags.error };
        }
        const docSections = await this.readDocSections();
        if (!docSections.success) {
            return { success: false, error: docSections.error };
        }
        const docPages = await this.readDocPages();
        if (!docPages.success) {
            return { success: false, error: docPages.error };
        }
        const assets = await this.readAssets();
        if (!assets.success) {
            return { success: false, error: assets.error };
        }
        const routes = buildPublishingRouteManifest({
            homepage: homepage.value,
            posts: posts.value,
            docSections: docSections.value,
            docPages: docPages.value,
        });
        if (!routes.success) {
            return {
                success: false,
                error: {
                    tag: "validation-failed",
                    reason: "Route manifest validation failed.",
                    issues: routes.error,
                },
            };
        }
        return {
            success: true,
            value: {
                siteSettings: siteSettings.value,
                navigation: navigation.value,
                homepage: homepage.value,
                tags: tags.value,
                posts: posts.value,
                pages: pages.value,
                docSections: docSections.value,
                docPages: docPages.value,
                assets: assets.value,
                routes: routes.value,
            },
        };
    }
    /**
     * Persist a draft record in `.studio/drafts`.
     */
    async saveDraft(draftId, draft) {
        await this.ensureWorkspace();
        const payload = {
            draftId,
            operation: draft.operation ?? "upsert",
            document: draft.document,
            savedAt: new Date().toISOString(),
            sourcePath: draft.sourcePath,
        };
        const draftPath = this.resolveDraftPath(draftId);
        try {
            await writeFile(draftPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
            return { success: true, value: payload };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    tag: "io-failed",
                    reason: String(error),
                    path: draftPath,
                },
            };
        }
    }
    /**
     * Load a draft record from `.studio/drafts`.
     */
    async readDraft(draftId) {
        const draftPath = this.resolveDraftPath(draftId);
        try {
            const source = await readFile(draftPath, "utf8");
            return { success: true, value: JSON.parse(source) };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    tag: "not-found",
                    reason: String(error),
                    path: draftPath,
                },
            };
        }
    }
    /**
     * Compute the file diff that would be written for a draft.
     */
    async renderDraftDiff(draftId) {
        const draft = await this.readDraft(draftId);
        if (!draft.success) {
            return { success: false, error: draft.error };
        }
        const snapshot = await this.readSnapshot();
        if (!snapshot.success) {
            return { success: false, error: snapshot.error };
        }
        const targetValidation = this.validateDraftTarget(snapshot.value, draft.value);
        if (!targetValidation.success) {
            return { success: false, error: targetValidation.error };
        }
        const nextSnapshot = this.applyDraftToSnapshot(snapshot.value, draft.value);
        const nextRoutes = buildPublishingRouteManifest({
            homepage: nextSnapshot.homepage,
            posts: nextSnapshot.posts,
            docSections: nextSnapshot.docSections,
            docPages: nextSnapshot.docPages,
        });
        if (!nextRoutes.success) {
            return {
                success: false,
                error: {
                    tag: "validation-failed",
                    reason: "Draft introduces invalid route state.",
                    issues: nextRoutes.error,
                },
            };
        }
        return this.prepareDraftDiffs(draft.value);
    }
    /**
     * Apply a validated draft to canonical content.
     */
    async applyDraft(draftId) {
        const draft = await this.readDraft(draftId);
        if (!draft.success) {
            return { success: false, error: draft.error };
        }
        const diffs = await this.renderDraftDiff(draftId);
        if (!diffs.success) {
            return { success: false, error: diffs.error };
        }
        try {
            for (const diff of diffs.value) {
                const absolutePath = join(this.paths.root, diff.relativePath);
                if (diff.after.length === 0) {
                    await rm(absolutePath, { force: true });
                    continue;
                }
                await mkdir(dirname(absolutePath), { recursive: true });
                await writeFile(absolutePath, diff.after, "utf8");
            }
            return diffs;
        }
        catch (error) {
            return {
                success: false,
                error: {
                    tag: "io-failed",
                    reason: String(error),
                },
            };
        }
    }
    /**
     * Load the site settings singleton with defaults when missing.
     */
    async readSiteSettings() {
        return this.readSingletonDocument(join(this.paths.siteDir, "site_settings.json"), "site_settings", {
            kind: "site_settings",
            title: "Untitled Site",
            description: "A local-first publishing workspace.",
            language: "en",
            footerNotice: "Built with Git-managed publishing content.",
            contactEmail: "hello@example.com",
            socialLinks: [],
        });
    }
    /**
     * Load the navigation singleton with defaults when missing.
     */
    async readNavigation() {
        return this.readSingletonDocument(join(this.paths.siteDir, "navigation.json"), "navigation", {
            kind: "navigation",
            mainLinks: [],
            footerLinks: [],
        });
    }
    /**
     * Load the homepage singleton with defaults when missing.
     */
    async readHomepage() {
        return this.readSingletonDocument(join(this.paths.siteDir, "homepage.json"), "homepage", {
            kind: "homepage",
            heroEyebrow: "Local-first publishing",
            heroTitle: "Start publishing from Git-managed content.",
            heroBody: "Use the local studio to preview and publish static content.",
            heroMetrics: [],
            primaryCta: {
                label: "Open docs",
                href: "/docs",
            },
            featureBlocks: [],
            ctaBlocks: [],
        });
    }
    /**
     * Load all blog/news posts.
     */
    async readPosts() {
        return this.readMarkdownCollection(this.paths.postsDir, "post");
    }
    /**
     * Load all standalone pages.
     */
    async readPages() {
        return this.readMarkdownCollection(this.paths.pagesDir, "page");
    }
    /**
     * Load all canonical tags.
     */
    async readTags() {
        return this.readStructuredCollection(this.paths.tagsDir, "tag");
    }
    /**
     * Load all docs sections.
     */
    async readDocSections() {
        return this.readStructuredCollection(this.paths.docsSectionsDir, "doc_section");
    }
    /**
     * Load all docs pages.
     */
    async readDocPages() {
        return this.readMarkdownCollection(this.paths.docsPagesDir, "doc_page");
    }
    /**
     * Load the Git-managed media manifest directly from the media directory.
     */
    async readAssets() {
        const files = await this.listFiles(this.paths.mediaDir);
        const assets = files.map((absolutePath) => {
            const relPath = relative(this.paths.root, absolutePath);
            const base = relPath.split("/").at(-1) ?? relPath;
            return {
                kind: "asset",
                id: relPath,
                path: relPath,
                label: base,
                mimeType: inferMimeType(base),
            };
        });
        return { success: true, value: assets };
    }
    applyDraftToSnapshot(snapshot, draft) {
        const { document, sourcePath } = draft;
        if (draft.operation === "delete") {
            switch (document.kind) {
                case "site_settings":
                case "navigation":
                case "homepage":
                case "asset":
                    return snapshot;
                case "tag":
                    return {
                        ...snapshot,
                        tags: deleteCollectionEntry(snapshot.tags, {
                            root: this.paths.root,
                            sourcePath,
                            resolvePath: (entry) => this.resolveCanonicalPath(entry),
                            matchesIdentity: (entry, next) => normalizePublishingSlug(entry.slug) ===
                                normalizePublishingSlug(next.slug),
                        }, document),
                    };
                case "post":
                    return {
                        ...snapshot,
                        posts: deleteCollectionEntry(snapshot.posts, {
                            root: this.paths.root,
                            sourcePath,
                            resolvePath: (entry) => this.resolveCanonicalPath(entry),
                            matchesIdentity: (entry, next) => normalizePublishingSlug(entry.slug) ===
                                normalizePublishingSlug(next.slug),
                        }, document),
                    };
                case "page":
                    return {
                        ...snapshot,
                        pages: deleteCollectionEntry(snapshot.pages, {
                            root: this.paths.root,
                            sourcePath,
                            resolvePath: (entry) => this.resolveCanonicalPath(entry),
                            matchesIdentity: (entry, next) => normalizePublishingSlug(entry.slug) ===
                                normalizePublishingSlug(next.slug),
                        }, document),
                    };
                case "doc_section":
                    return {
                        ...snapshot,
                        docSections: deleteCollectionEntry(snapshot.docSections, {
                            root: this.paths.root,
                            sourcePath,
                            resolvePath: (entry) => this.resolveCanonicalPath(entry),
                            matchesIdentity: (entry, next) => slugifyPublishingValue(entry.id) === slugifyPublishingValue(next.id),
                        }, document),
                    };
                case "doc_page":
                    return {
                        ...snapshot,
                        docPages: deleteCollectionEntry(snapshot.docPages, {
                            root: this.paths.root,
                            sourcePath,
                            resolvePath: (entry) => this.resolveCanonicalPath(entry),
                            matchesIdentity: (entry, next) => normalizePublishingSlug(entry.slug) ===
                                normalizePublishingSlug(next.slug),
                        }, document),
                    };
            }
        }
        switch (document.kind) {
            case "site_settings":
                return { ...snapshot, siteSettings: document };
            case "navigation":
                return { ...snapshot, navigation: document };
            case "homepage":
                return { ...snapshot, homepage: document };
            case "tag":
                return {
                    ...snapshot,
                    tags: replaceCollectionEntry(snapshot.tags, document, {
                        root: this.paths.root,
                        sourcePath,
                        resolvePath: (entry) => this.resolveCanonicalPath(entry),
                        matchesIdentity: (entry, next) => normalizePublishingSlug(entry.slug) ===
                            normalizePublishingSlug(next.slug),
                        compare: compareByNormalizedSlug,
                    }),
                };
            case "post":
                return {
                    ...snapshot,
                    posts: replaceCollectionEntry(snapshot.posts, document, {
                        root: this.paths.root,
                        sourcePath,
                        resolvePath: (entry) => this.resolveCanonicalPath(entry),
                        matchesIdentity: (entry, next) => normalizePublishingSlug(entry.slug) ===
                            normalizePublishingSlug(next.slug),
                        compare: compareByNormalizedSlug,
                    }),
                };
            case "page":
                return {
                    ...snapshot,
                    pages: replaceCollectionEntry(snapshot.pages, document, {
                        root: this.paths.root,
                        sourcePath,
                        resolvePath: (entry) => this.resolveCanonicalPath(entry),
                        matchesIdentity: (entry, next) => normalizePublishingSlug(entry.slug) ===
                            normalizePublishingSlug(next.slug),
                        compare: compareByNormalizedSlug,
                    }),
                };
            case "doc_section":
                return {
                    ...snapshot,
                    docSections: replaceCollectionEntry(snapshot.docSections, document, {
                        root: this.paths.root,
                        sourcePath,
                        resolvePath: (entry) => this.resolveCanonicalPath(entry),
                        matchesIdentity: (entry, next) => slugifyPublishingValue(entry.id) === slugifyPublishingValue(next.id),
                        compare: compareByNormalizedId,
                    }),
                };
            case "doc_page":
                return {
                    ...snapshot,
                    docPages: replaceCollectionEntry(snapshot.docPages, document, {
                        root: this.paths.root,
                        sourcePath,
                        resolvePath: (entry) => this.resolveCanonicalPath(entry),
                        matchesIdentity: (entry, next) => normalizePublishingSlug(entry.slug) ===
                            normalizePublishingSlug(next.slug),
                        compare: compareByNormalizedSlug,
                    }),
                };
            case "asset":
                return snapshot;
        }
    }
    validateDraftTarget(snapshot, draft) {
        if (draft.operation === "delete") {
            return { success: true, value: undefined };
        }
        const targetPath = this.resolveCanonicalPath(draft.document);
        const absoluteSourcePath = draft.sourcePath && draft.sourcePath.length > 0
            ? join(this.paths.root, draft.sourcePath)
            : undefined;
        switch (draft.document.kind) {
            case "site_settings":
            case "navigation":
            case "homepage":
            case "asset":
                return { success: true, value: undefined };
            case "tag":
                return this.validateCollectionTarget(snapshot.tags, {
                    targetPath,
                    absoluteSourcePath,
                });
            case "post":
                return this.validateCollectionTarget(snapshot.posts, {
                    targetPath,
                    absoluteSourcePath,
                });
            case "page":
                return this.validateCollectionTarget(snapshot.pages, {
                    targetPath,
                    absoluteSourcePath,
                });
            case "doc_section":
                return this.validateCollectionTarget(snapshot.docSections, {
                    targetPath,
                    absoluteSourcePath,
                });
            case "doc_page":
                return this.validateCollectionTarget(snapshot.docPages, {
                    targetPath,
                    absoluteSourcePath,
                });
        }
    }
    validateCollectionTarget(collection, paths) {
        const conflictingEntry = collection.find((entry) => {
            const existingPath = this.resolveCanonicalPath(entry);
            return (existingPath === paths.targetPath &&
                existingPath !== paths.absoluteSourcePath);
        });
        if (!conflictingEntry) {
            return { success: true, value: undefined };
        }
        const relativeTargetPath = relative(this.paths.root, paths.targetPath);
        const issues = [
            {
                path: relativeTargetPath,
                message: `Canonical path '${relativeTargetPath}' is already claimed by ${describePublishingDocument(conflictingEntry)}.`,
            },
        ];
        return {
            success: false,
            error: {
                tag: "validation-failed",
                reason: "Draft would overwrite an existing canonical document.",
                path: relativeTargetPath,
                issues,
            },
        };
    }
    async prepareDraftDiffs(draft) {
        const targetPath = this.resolveCanonicalPath(draft.document);
        const nextContent = draft.operation === "delete"
            ? ""
            : this.serializeCanonicalDocument(draft.document);
        const currentContent = await readTextIfPresent(targetPath);
        const diffPath = draft.operation === "delete" && draft.sourcePath && draft.sourcePath.length > 0
            ? join(this.paths.root, draft.sourcePath)
            : targetPath;
        const diffs = [
            {
                relativePath: relative(this.paths.root, diffPath),
                before: diffPath === targetPath ? currentContent : await readTextIfPresent(diffPath),
                after: nextContent,
            },
        ];
        if (draft.operation !== "delete" &&
            draft.sourcePath &&
            draft.sourcePath.length > 0) {
            const absoluteSourcePath = join(this.paths.root, draft.sourcePath);
            if (absoluteSourcePath !== targetPath) {
                diffs.push({
                    relativePath: draft.sourcePath,
                    before: await readTextIfPresent(absoluteSourcePath),
                    after: "",
                });
            }
        }
        return { success: true, value: diffs };
    }
    resolveCanonicalPath(document) {
        switch (document.kind) {
            case "site_settings":
                return join(this.paths.siteDir, "site_settings.json");
            case "navigation":
                return join(this.paths.siteDir, "navigation.json");
            case "homepage":
                return join(this.paths.siteDir, "homepage.json");
            case "tag":
                return join(this.paths.tagsDir, `${normalizePublishingSlug(document.slug)}.json`);
            case "post":
                return join(this.paths.postsDir, `${normalizePublishingSlug(document.slug)}.mdx`);
            case "page":
                return join(this.paths.pagesDir, `${normalizePublishingSlug(document.slug)}.mdx`);
            case "doc_section":
                return join(this.paths.docsSectionsDir, `${slugifyPublishingValue(document.id)}.json`);
            case "doc_page":
                return join(this.paths.docsPagesDir, `${normalizePublishingSlug(document.slug)}.mdx`);
            case "asset":
                return join(this.paths.root, document.path);
        }
    }
    serializeCanonicalDocument(document) {
        switch (document.kind) {
            case "site_settings":
            case "navigation":
            case "homepage":
            case "tag":
            case "doc_section":
                return `${JSON.stringify(document, null, 2)}\n`;
            case "post":
            case "page":
            case "doc_page":
                return serializeFrontmatterDocument(omitDocumentBody(document), document.body);
            case "asset":
                throw new Error("Asset serialization is not supported.");
        }
    }
    resolveDraftPath(draftId) {
        return join(this.paths.draftsDir, `${draftId}.json`);
    }
    async readSingletonDocument(path, kind, fallback) {
        try {
            const source = await readTextIfPresent(path);
            if (source.length === 0) {
                logger.info("Using fallback singleton document", { kind, path });
                return { success: true, value: fallback };
            }
            const parsed = parseStructuredFile(path, source);
            const validation = validatePublishingDocument(kind, parsed, path);
            if (!validation.success) {
                return {
                    success: false,
                    error: {
                        tag: "validation-failed",
                        reason: `Invalid ${kind} document.`,
                        path,
                        issues: validation.error,
                    },
                };
            }
            return { success: true, value: validation.value };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    tag: "io-failed",
                    reason: String(error),
                    path,
                },
            };
        }
    }
    async readStructuredCollection(directory, kind) {
        try {
            const files = await this.listFiles(directory, [".json", ".yaml", ".yml"]);
            const records = [];
            for (const path of files) {
                const source = await readFile(path, "utf8");
                const parsed = parseStructuredFile(path, source);
                const validation = validatePublishingDocument(kind, parsed, path);
                if (!validation.success) {
                    return {
                        success: false,
                        error: {
                            tag: "validation-failed",
                            reason: `Invalid ${kind} document.`,
                            path,
                            issues: validation.error,
                        },
                    };
                }
                records.push(validation.value);
            }
            return { success: true, value: records };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    tag: "io-failed",
                    reason: String(error),
                    path: directory,
                },
            };
        }
    }
    async readMarkdownCollection(directory, kind) {
        try {
            const files = await this.listFiles(directory, [".md", ".mdx"]);
            const records = [];
            for (const path of files) {
                const source = await readFile(path, "utf8");
                const parsed = parseFrontmatterDocument(source);
                const validation = validatePublishingDocument(kind, {
                    ...parsed.frontmatter,
                    body: parsed.body.trim(),
                    kind,
                }, path);
                if (!validation.success) {
                    return {
                        success: false,
                        error: {
                            tag: "validation-failed",
                            reason: `Invalid ${kind} document.`,
                            path,
                            issues: validation.error,
                        },
                    };
                }
                records.push(validation.value);
            }
            return { success: true, value: records };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    tag: "io-failed",
                    reason: String(error),
                    path: directory,
                },
            };
        }
    }
    async listFiles(directory, allowedExtensions) {
        if (!(await pathExists(directory))) {
            return [];
        }
        const entries = await readdir(directory, { withFileTypes: true });
        const files = await Promise.all(entries.map(async (entry) => {
            const absolutePath = join(directory, entry.name);
            if (entry.isDirectory()) {
                return this.listFiles(absolutePath, allowedExtensions);
            }
            if (allowedExtensions &&
                !allowedExtensions.includes(extname(entry.name).toLowerCase())) {
                return [];
            }
            return [absolutePath];
        }));
        return files.flat().sort((left, right) => left.localeCompare(right));
    }
}
function replaceCollectionEntry(collection, document, options) {
    const absoluteSourcePath = options.sourcePath && options.sourcePath.length > 0
        ? join(options.root, options.sourcePath)
        : undefined;
    const next = collection.filter((entry) => {
        if (absoluteSourcePath) {
            return options.resolvePath(entry) !== absoluteSourcePath;
        }
        return !options.matchesIdentity(entry, document);
    });
    return [...next, document].sort(options.compare);
}
function deleteCollectionEntry(collection, options, document) {
    const absoluteSourcePath = options.sourcePath && options.sourcePath.length > 0
        ? join(options.root, options.sourcePath)
        : undefined;
    return collection.filter((entry) => {
        if (absoluteSourcePath) {
            return options.resolvePath(entry) !== absoluteSourcePath;
        }
        return document ? !options.matchesIdentity(entry, document) : true;
    });
}
function compareByNormalizedSlug(left, right) {
    return normalizePublishingSlug(left.slug).localeCompare(normalizePublishingSlug(right.slug));
}
function compareByNormalizedId(left, right) {
    return slugifyPublishingValue(left.id).localeCompare(slugifyPublishingValue(right.id));
}
function describePublishingDocument(document) {
    switch (document.kind) {
        case "site_settings":
            return "the site settings singleton";
        case "navigation":
            return "the navigation singleton";
        case "homepage":
            return "the homepage singleton";
        case "tag":
            return `tag '${document.slug}'`;
        case "post":
            return `post '${document.slug}'`;
        case "page":
            return `page '${document.slug}'`;
        case "doc_section":
            return `docs section '${document.id}'`;
        case "doc_page":
            return `docs page '${document.slug}'`;
        case "asset":
            return `asset '${document.path}'`;
    }
}
function parseStructuredFile(path, source) {
    if (path.endsWith(".json")) {
        return JSON.parse(source);
    }
    return parseYaml(source);
}
async function pathExists(path) {
    try {
        await stat(path);
        return true;
    }
    catch {
        return false;
    }
}
async function readTextIfPresent(path) {
    try {
        return await readFile(path, "utf8");
    }
    catch {
        return "";
    }
}
function inferMimeType(path) {
    const extension = extname(path).toLowerCase();
    switch (extension) {
        case ".png":
            return "image/png";
        case ".jpg":
        case ".jpeg":
            return "image/jpeg";
        case ".svg":
            return "image/svg+xml";
        case ".webp":
            return "image/webp";
        case ".gif":
            return "image/gif";
        default:
            return undefined;
    }
}
function omitDocumentBody(document) {
    const record = { ...document };
    delete record.body;
    return record;
}
